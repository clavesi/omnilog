/**
 * No API key needed, but two hard requirements from their usage policy:
 *   1. Rate limit is 1 request/second — stricter than Jikan's 3/sec. Their
 *      rate-limit response is 503, not 429.
 *   2. Every request MUST send a descriptive User-Agent identifying the
 *      app and a contact point, or you risk being blocked outright.
 *      Replace the placeholder URL below with your actual deployed URL
 *      (or an email) before shipping to production.
 *
 * track_count / duration_seconds are left null at album-import time
 * (a release-level lookup is a second API call beyond what's needed for the album itself)
 * but get filled in lazily by importAlbumTracks() the first time someone actually browses the track list - see that function for details.
 * Label is fetched eagerly at import time via fetchFirstLabel().
 */

import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { type MusicMetadata, mediaExternalIds, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { buildSlug, findExistingMediaId, linkGenres } from "$lib/server/media-import";
import { createPart, findFlatParts } from "$lib/server/parts";

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
			track_count: null, // filled in lazily by importAlbumTracks() when tracks are first browsed
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

// ============================================================================
// Import: album tracks
//
// Deferred at album-import time (see file header) — a track listing needs
// a release-level lookup beyond the release-group data used for the album
// itself, which isn't worth the extra API call for every album imported,
// most of which nobody will ever browse track-by-track.
// Lazy + cached in media_parts, same pattern as TV/anime episodes: only fetched the first time someone actually views the track list.
//
// A release-group can have multiple releases (regional variants, reissues,
// deluxe editions, etc.) with different track lists — this picks whichever
// release MusicBrainz returns first as "representative" rather than trying
// to determine a canonical one, which MusicBrainz itself doesn't expose a
// clean way to do.
// ============================================================================

type MbTrackRaw = {
	title: string;
	length: number | null; // milliseconds
};

type MbMedium = { tracks?: MbTrackRaw[] };
type MbReleaseWithMedia = { media?: MbMedium[] };

async function fetchRepresentativeReleaseId(releaseGroupMbid: string): Promise<string | null> {
	const data = await mbFetch<{ releases: { id: string }[] }>(
		`/release?release-group=${releaseGroupMbid}&fmt=json&limit=1`,
	);
	return data.releases?.[0]?.id ?? null;
}

async function fetchReleaseTracks(releaseId: string): Promise<{ title: string; lengthMs: number | null }[]> {
	const data = await mbFetch<MbReleaseWithMedia>(`/release/${releaseId}?fmt=json&inc=recordings`);

	// Flatten multi-disc releases into one sequential track list — "Disc 2
	// Track 3" style per-medium numbering would need a schema change.
	const tracks: { title: string; lengthMs: number | null }[] = [];
	for (const medium of data.media ?? []) {
		for (const t of medium.tracks ?? []) {
			tracks.push({ title: t.title, lengthMs: t.length });
		}
	}
	return tracks;
}

export async function importAlbumTracks(mediaItemId: string, mbid: string) {
	const existing = await findFlatParts(mediaItemId, "track");
	if (existing.length > 0) return existing;

	const releaseId = await fetchRepresentativeReleaseId(mbid);
	if (!releaseId) return []; // no releases registered for this release-group — nothing to import

	const tracks = await fetchReleaseTracks(releaseId);
	if (tracks.length === 0) return [];

	await db.transaction(async (tx) => {
		let position = 1;
		for (const t of tracks) {
			await createPart(tx, {
				mediaItemId,
				parentPartId: null,
				partType: "track",
				partNumber: position++,
				title: t.title,
				releaseDate: null,
				metadata: { durationMs: t.lengthMs },
			});
		}

		// Now that we have real track data, fill in the album-level
		// track_count/duration_seconds that were left null at import time.
		const [currentMeta] = await tx
			.select()
			.from(mediaMetadata)
			.where(eq(mediaMetadata.mediaItemId, mediaItemId))
			.limit(1);

		if (currentMeta && currentMeta.metadata.type === "music") {
			const knownDurations = tracks.filter((t) => t.lengthMs !== null);
			const totalMs = knownDurations.reduce((sum, t) => sum + (t.lengthMs ?? 0), 0);

			await tx
				.update(mediaMetadata)
				.set({
					metadata: {
						...currentMeta.metadata,
						track_count: tracks.length,
						// Only meaningful if every track reported a duration —
						// otherwise a partial sum would understate the runtime.
						duration_seconds: knownDurations.length === tracks.length ? Math.round(totalMs / 1000) : null,
					},
				})
				.where(eq(mediaMetadata.mediaItemId, mediaItemId));
		}
	});

	return findFlatParts(mediaItemId, "track");
}
