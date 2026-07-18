/**
 * No API key needed, but two hard requirements from their usage policy:
 *   1. Rate limit is 1 request/second — stricter than Jikan's 3/sec. Their
 *      rate-limit response is 503, not 429.
 *   2. Every request MUST send a descriptive User-Agent identifying the
 *      app and a contact point, or you risk being blocked outright.
 *      Replace the placeholder URL below with your actual deployed URL
 *      (or an email) before shipping to production.
 *
 * Scope note: track count / duration / label are left null for v1. Getting
 * them reliably requires a second, release-level API call beyond the
 * release-group lookup used here, which would add real latency given the
 * 1 req/sec throttle. Tracked as a follow-up rather than built now.
 */

import { db } from "$lib/server/db";
import { type MusicMetadata, mediaExternalIds, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { buildSlug, findExistingMediaId, linkGenres } from "$lib/server/media-import";

const MB_BASE = "https://musicbrainz.org/ws/2";
const COVER_ART_BASE = "https://coverartarchive.org";

const USER_AGENT = "Omnilog/0.1 (gitclavesi@gmail.com)";

const MIN_REQUEST_GAP_MS = 1100; // just over 1/sec, matches MB's stated limit

// ============================================================================
// Throttle — same pattern as jikan.ts's, but keyed to MusicBrainz's stricter
// limit and its 503 (not 429) rate-limit response code.
// ============================================================================

let lastRequestAt = 0;
let throttleChain: Promise<void> = Promise.resolve();

/** setTimeout that rejects early if the signal aborts while waiting. */
function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
			},
			{ once: true },
		);
	});
}

function throttled<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
	const run = throttleChain.then(async () => {
		const wait = Math.max(0, lastRequestAt + MIN_REQUEST_GAP_MS - Date.now());
		if (wait > 0) await abortableDelay(wait, signal);
		lastRequestAt = Date.now();
	});
	throttleChain = run.catch(() => {});
	return run.then(fn);
}

async function mbFetch<T>(path: string, signal?: AbortSignal, retriesLeft = 2): Promise<T> {
	return throttled(async () => {
		const res = await fetch(`${MB_BASE}${path}`, {
			headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
			signal,
		});

		if (res.status === 503) {
			if (retriesLeft <= 0) {
				throw new Error(`MusicBrainz ${path} failed: rate limited, retries exhausted`);
			}
			await abortableDelay(1500, signal);
			return mbFetch<T>(path, signal, retriesLeft - 1);
		}

		if (!res.ok) {
			throw new Error(`MusicBrainz ${path} failed: ${res.status} ${res.statusText}`);
		}
		return res.json() as Promise<T>;
	}, signal);
}

// ============================================================================
// Raw response shapes (only the fields we use)
// ============================================================================

type MbArtistCredit = { name: string; artist: { name: string } };

type MbReleaseGroupSearchRaw = {
	id: string; // MBID, a UUID string — not an integer like other sources
	title: string;
	"primary-type"?: string; // "Album", "EP", "Single", "Compilation"
	"first-release-date"?: string;
	"artist-credit"?: MbArtistCredit[];
};

type MbLabelInfo = { label?: { name: string } };
type MbRelease = { id: string; "label-info"?: MbLabelInfo[] };

type MbReleaseGroupDetailRaw = {
	id: string;
	title: string;
	"primary-type"?: string;
	"first-release-date"?: string;
	"artist-credit"?: MbArtistCredit[];
	genres?: { name: string; count: number }[];
};

type MbCoverArtResponse = {
	images: { image: string; thumbnails: { large?: string; small?: string } }[];
};

// ============================================================================
// Public: search hit type
// ============================================================================

export type MusicBrainzSearchHit = {
	type: "music";
	id: string; // MBID
	title: string;
	artists: string[];
	year: number | null;
	primaryType: string | null;
	coverUrl: string | null;
};

// ============================================================================
// Public: search
// ============================================================================

export async function searchAlbums(query: string, signal?: AbortSignal): Promise<MusicBrainzSearchHit[]> {
	if (!query.trim()) return [];

	const data = await mbFetch<{ "release-groups": MbReleaseGroupSearchRaw[] }>(
		`/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
		signal,
	);

	const groups = data["release-groups"] ?? [];

	// Cover art requires a separate per-item lookup (no batch endpoint), and
	// a given release-group frequently has no registered art at all — treat
	// a failure/404 here as "no cover", not an error worth surfacing.
	const withCovers = await Promise.all(
		groups.map(async (g) => {
			const coverUrl = await fetchCoverArtUrl(g.id, signal).catch(() => null);
			return { g, coverUrl };
		}),
	);

	return withCovers.map(
		({ g, coverUrl }): MusicBrainzSearchHit => ({
			type: "music",
			id: g.id,
			title: g.title,
			artists: (g["artist-credit"] ?? []).map((a) => a.artist.name),
			year: g["first-release-date"] ? Number(g["first-release-date"].slice(0, 4)) : null,
			primaryType: g["primary-type"] ?? null,
			coverUrl,
		}),
	);
}

async function fetchCoverArtUrl(releaseGroupMbid: string, signal?: AbortSignal): Promise<string | null> {
	const res = await fetch(`${COVER_ART_BASE}/release-group/${releaseGroupMbid}`, {
		headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
		signal,
	});
	if (!res.ok) return null; // 404 is the common/expected case — no art registered
	const data = (await res.json()) as MbCoverArtResponse;
	const first = data.images?.[0];
	return first?.thumbnails?.large ?? first?.image ?? null;
}

// ============================================================================
// Public: fetch details (for import)
// ============================================================================

async function fetchAlbumDetails(mbid: string): Promise<MbReleaseGroupDetailRaw> {
	// release-group only supports artist-credits (+ genres via tag API).
	// labels is valid on /release, not here — see fetchFirstLabel().
	return mbFetch<MbReleaseGroupDetailRaw>(`/release-group/${mbid}?fmt=json&inc=artist-credits+genres`);
}

async function fetchFirstLabel(releaseGroupMbid: string): Promise<string | null> {
	const data = await mbFetch<{ releases: MbRelease[] }>(
		`/release?release-group=${releaseGroupMbid}&fmt=json&inc=labels&limit=1`,
	);
	return data.releases?.[0]?.["label-info"]?.[0]?.label?.name ?? null;
}

// ============================================================================
// Import: idempotent, mirrors the other import*() functions
// ============================================================================

export async function importAlbum(mbid: string): Promise<string> {
	const existing = await findExistingMediaId("musicbrainz", mbid);
	if (existing) return existing;

	const album = await fetchAlbumDetails(mbid);
	const [coverUrl, label] = await Promise.all([
		fetchCoverArtUrl(mbid).catch(() => null),
		fetchFirstLabel(mbid).catch(() => null),
	]);

	const releaseDate = album["first-release-date"] || null;
	const artists = (album["artist-credit"] ?? []).map((a) => a.artist.name);

	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(album.title, releaseDate, "music", mbid),
				mediaType: "music",
				title: album.title,
				originalTitle: null,
				description: null, // MusicBrainz doesn't provide album descriptions
				releaseDate,
				coverImageUrl: coverUrl,
				backdropImageUrl: null,
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "musicbrainz",
			externalId: mbid,
			url: `https://musicbrainz.org/release-group/${mbid}`,
		});

		const metadata: MusicMetadata = {
			type: "music",
			artists,
			track_count: null, // see file header — deferred, needs a release-level call
			duration_seconds: null, // same
			label,
			album_type: album["primary-type"]?.toLowerCase() ?? null,
		};

		await tx.insert(mediaMetadata).values({ mediaItemId, metadata });

		if (album.genres?.length) {
			await linkGenres(tx, mediaItemId, album.genres);
		}

		return mediaItemId;
	});
}
