/**
 * Backed by Tenrai (api.tenrai.org)
 * Jikan's public instance is shutting down (brownout Sept 1 2026, full shutdown Oct 1 2026).
 * Tenrai's v1 schema is documented as a 1:1 mirror of Jikan v4.
 *
 * Note: throttle values below were inherited from Jikan's documented limits (~3 req/sec, ~60/min)
 * as a safe conservative default. Tenrai markets itself as "built for scale" and may tolerate more throughput.
 * Worth revisiting against their actual documented limits if this ever becomes a bottleneck.
 */

import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
	type AnimeMetadata,
	type MangaMetadata,
	mediaExternalIds,
	mediaItems,
	mediaMetadata,
} from "$lib/server/db/schema";
import { findPossibleDuplicate, PossibleDuplicateError } from "$lib/server/dedupe";
import { buildSlug, findExistingMediaId, linkGenres } from "$lib/server/media-import";
import { createPart, findFlatParts } from "$lib/server/parts";

const TENRAI_BASE = "https://api.tenrai.org/v1";
const MIN_REQUEST_GAP_MS = 350; // ~2.8/sec, conservative default inherited from Jikan's limits

// ============================================================================
// Simple sequential throttle — queues requests so they're spaced out rather
// than firing concurrently and tripping the rate limit.
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
	throttleChain = run.catch(() => {}); // keep the chain alive even if one call errors
	return run.then(fn);
}

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

/**
 * signal: pass the originating request's AbortSignal through so a search
 * superseded by newer typeahead input actually stops — both while queued
 * (abortableDelay) and mid-flight (fetch's own signal support) — instead
 * of quietly finishing (and retrying) in the background. Without this,
 * rapid typing can pile up stale, still-running searches behind the
 * shared throttle queue, which can itself trip Jikan's real rate limit
 * for the searches that actually still matter.
 */
async function jikanFetch<T>(path: string, signal?: AbortSignal, retriesLeft = 2): Promise<T> {
	return throttled(async () => {
		const res = await fetch(`${TENRAI_BASE}${path}`, { signal });

		if (RETRYABLE_STATUSES.has(res.status)) {
			if (retriesLeft <= 0) {
				throw new Error(`Tenrai ${path} failed: ${res.status} ${res.statusText}, retries exhausted`);
			}
			// Respect Retry-After if the upstream sends one (mainly a 429
			// thing). For 502/503/504 there's usually no such header — back
			// off with a fixed delay instead, since those tend to be brief
			// upstream (MyAnimeList.net) hiccups that clear up in a second
			// or two.
			const retryAfterHeader = res.headers.get("Retry-After");
			const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 1000;
			await abortableDelay(retryAfterMs, signal);
			return jikanFetch<T>(path, signal, retriesLeft - 1);
		}

		if (!res.ok) {
			throw new Error(`Tenrai ${path} failed: ${res.status} ${res.statusText}`);
		}
		const json = await res.json();
		return json.data as T;
	}, signal);
}

// ============================================================================
// Raw response shapes (only the fields we use)
// ============================================================================

type JikanImages = {
	jpg: { image_url: string | null; large_image_url: string | null };
};

type JikanAnimeSearchRaw = {
	mal_id: number;
	title: string;
	images: JikanImages;
	year: number | null;
	episodes: number | null;
};

type JikanMangaSearchRaw = {
	mal_id: number;
	title: string;
	images: JikanImages;
	published: { from: string | null };
	chapters: number | null;
};

type JikanAnimeFullRaw = {
	mal_id: number;
	title: string;
	synopsis: string | null;
	images: JikanImages;
	episodes: number | null;
	duration: string | null; // e.g. "24 min per ep" or "2 hr 5 min"
	studios: { name: string }[];
	source: string | null; // "Manga", "Light novel", "Original", etc.
	season: string | null; // "spring", "summer", ...
	year: number | null;
	status: string | null; // "Finished Airing", "Currently Airing"
	genres: { mal_id: number; name: string }[];
};

type JikanMangaFullRaw = {
	mal_id: number;
	title: string;
	synopsis: string | null;
	images: JikanImages;
	chapters: number | null;
	volumes: number | null;
	authors: { name: string }[];
	serializations: { name: string }[];
	status: string | null; // "Publishing", "Finished", ...
	published: { from: string | null };
	genres: { mal_id: number; name: string }[];
};

// ============================================================================
// Public: search hit type
// ============================================================================

export type JikanSearchHit =
	| {
			type: "anime";
			id: number;
			title: string;
			imageUrl: string | null;
			year: number | null;
			episodes: number | null;
	  }
	| {
			type: "manga";
			id: number;
			title: string;
			imageUrl: string | null;
			year: number | null;
			chapters: number | null;
	  };

// ============================================================================
// Public: search
// ============================================================================

export async function searchAnime(query: string, signal?: AbortSignal): Promise<JikanSearchHit[]> {
	if (!query.trim()) return [];

	const results = await jikanFetch<JikanAnimeSearchRaw[]>(
		`/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
		signal,
	);

	// Jikan occasionally returns the same mal_id twice in one search
	// response — dedupe before mapping to avoid duplicate keys downstream.
	const seen = new Set<number>();
	const deduped = results.filter((r) => {
		if (seen.has(r.mal_id)) return false;
		seen.add(r.mal_id);
		return true;
	});

	return deduped.map(
		(r): JikanSearchHit => ({
			type: "anime",
			id: r.mal_id,
			title: r.title,
			imageUrl: r.images.jpg.large_image_url ?? r.images.jpg.image_url,
			year: r.year,
			episodes: r.episodes,
		}),
	);
}

export async function searchManga(query: string, signal?: AbortSignal): Promise<JikanSearchHit[]> {
	if (!query.trim()) return [];

	const results = await jikanFetch<JikanMangaSearchRaw[]>(
		`/manga?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
		signal,
	);

	// Same dedupe as searchAnime — Jikan's search index can return a manga
	// twice (e.g. once for the main entry, once via a cross-reference).
	const seen = new Set<number>();
	const deduped = results.filter((r) => {
		if (seen.has(r.mal_id)) return false;
		seen.add(r.mal_id);
		return true;
	});

	return deduped.map(
		(r): JikanSearchHit => ({
			type: "manga",
			id: r.mal_id,
			title: r.title,
			imageUrl: r.images.jpg.large_image_url ?? r.images.jpg.image_url,
			year: r.published.from ? new Date(r.published.from).getFullYear() : null,
			chapters: r.chapters,
		}),
	);
}

// ============================================================================
// Public: fetch full details (for import)
// ============================================================================

async function fetchAnimeDetails(malId: number): Promise<JikanAnimeFullRaw> {
	return jikanFetch<JikanAnimeFullRaw>(`/anime/${malId}/full`);
}

async function fetchMangaDetails(malId: number): Promise<JikanMangaFullRaw> {
	return jikanFetch<JikanMangaFullRaw>(`/manga/${malId}/full`);
}

// ============================================================================
// Duration parsing — Jikan gives free-text like "24 min per ep" or
// "2 hr 5 min". Extract total minutes per episode.
// ============================================================================

function parseDurationMinutes(raw: string | null): number | null {
	if (!raw) return null;
	const hrMatch = raw.match(/(\d+)\s*hr/);
	const minMatch = raw.match(/(\d+)\s*min/);
	const hours = hrMatch ? Number(hrMatch[1]) : 0;
	const minutes = minMatch ? Number(minMatch[1]) : 0;
	const total = hours * 60 + minutes;
	return total > 0 ? total : null;
}

// ============================================================================
// Import: anime
// ============================================================================

export async function importAnime(malId: number, options?: { allowDuplicate?: boolean }): Promise<string> {
	const existing = await findExistingMediaId("mal", `anime:${malId}`);
	if (existing) return existing;

	const anime = await fetchAnimeDetails(malId);
	const releaseDate = anime.year ? `${anime.year}-01-01` : null;

	if (!options?.allowDuplicate) {
		const duplicate = await findPossibleDuplicate(anime.title, releaseDate);
		if (duplicate) throw new PossibleDuplicateError(duplicate);
	}

	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(anime.title, anime.year, "anime", malId),
				mediaType: "anime",
				title: anime.title,
				originalTitle: null,
				description: anime.synopsis,
				releaseDate,
				coverImageUrl: anime.images.jpg.large_image_url ?? anime.images.jpg.image_url,
				backdropImageUrl: null,
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "mal",
			externalId: `anime:${malId}`,
			url: `https://myanimelist.net/anime/${malId}`,
		});

		const metadata: AnimeMetadata = {
			type: "anime",
			episodes: anime.episodes,
			duration_minutes: parseDurationMinutes(anime.duration),
			studios: anime.studios.map((s) => s.name),
			source: anime.source,
			season: anime.season,
			status: anime.status,
		};

		await tx.insert(mediaMetadata).values({ mediaItemId, metadata });
		await linkGenres(tx, mediaItemId, anime.genres);

		return mediaItemId;
	});
}

// ============================================================================
// Import: manga
// ============================================================================

export async function importManga(malId: number): Promise<string> {
	const existing = await findExistingMediaId("mal", `manga:${malId}`);
	if (existing) return existing;

	const manga = await fetchMangaDetails(malId);

	return db.transaction(async (tx) => {
		const releaseDate = manga.published.from ? manga.published.from.slice(0, 10) : null;

		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(manga.title, releaseDate?.slice(0, 4), "manga", malId),
				mediaType: "manga",
				title: manga.title,
				originalTitle: null,
				description: manga.synopsis,
				releaseDate,
				coverImageUrl: manga.images.jpg.large_image_url ?? manga.images.jpg.image_url,
				backdropImageUrl: null,
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "mal",
			externalId: `manga:${malId}`,
			url: `https://myanimelist.net/manga/${malId}`,
		});

		const metadata: MangaMetadata = {
			type: "manga",
			chapters: manga.chapters,
			volumes: manga.volumes,
			authors: manga.authors.map((a) => a.name),
			serialization: manga.serializations[0]?.name ?? null,
			status: manga.status,
		};

		await tx.insert(mediaMetadata).values({ mediaItemId, metadata });
		await linkGenres(tx, mediaItemId, manga.genres);

		return mediaItemId;
	});
}

// ============================================================================
// Import: anime episodes
//
// Flat list, no season nesting — MAL already treats each anime season as a
// separate top-level entry (its own mal_id), so there's no season layer to
// build here, unlike TV. Lazy + cached in media_parts, same as TV seasons.
// ============================================================================

type JikanEpisodeRaw = {
	mal_id: number; // this IS the episode number in this endpoint's context
	title: string;
	aired: string | null;
	filler: boolean;
	recap: boolean;
};

async function fetchAnimeEpisodes(malId: number): Promise<JikanEpisodeRaw[]> {
	// Page 1 only for v1 — Jikan paginates at 100/page, which covers the
	// vast majority of single MAL entries given how MAL splits long-running
	// shows into separate per-season/per-cour entries anyway.
	return jikanFetch<JikanEpisodeRaw[]>(`/anime/${malId}/episodes`);
}

export async function importAnimeEpisodes(mediaItemId: string) {
	const existing = await findFlatParts(mediaItemId, "episode");
	if (existing.length > 0) return existing;

	// Need the MAL id to hit the episodes endpoint — pull it back out of
	// media_external_ids rather than requiring the caller to pass it in
	// separately (keeps the call site simpler: just a mediaItemId).
	const [ext] = await db
		.select({ externalId: mediaExternalIds.externalId })
		.from(mediaExternalIds)
		.where(and(eq(mediaExternalIds.mediaItemId, mediaItemId), eq(mediaExternalIds.source, "mal")))
		.limit(1);

	if (!ext) throw new Error(`No MAL external id found for media item ${mediaItemId}`);
	const malId = Number(ext.externalId.replace("anime:", ""));

	const episodes = await fetchAnimeEpisodes(malId);

	await db.transaction(async (tx) => {
		for (const ep of episodes) {
			await createPart(tx, {
				mediaItemId,
				parentPartId: null,
				partType: "episode",
				partNumber: ep.mal_id,
				title: ep.title,
				releaseDate: ep.aired ? ep.aired.slice(0, 10) : null,
				metadata: { filler: ep.filler, recap: ep.recap },
			});
		}
	});

	return findFlatParts(mediaItemId, "episode");
}
