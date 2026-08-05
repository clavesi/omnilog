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
import { abortableDelay, createThrottle } from "./rate-limit";

const TENRAI_BASE = "https://api.tenrai.org/v1";

const throttled = createThrottle(350); // ~2.8/sec, conservative default inherited from Jikan/MAL documented limits

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

/**
 * signal: pass the originating request's AbortSignal through so a search
 * superseded by newer typeahead input actually stops — both while queued
 * (abortableDelay) and mid-flight (fetch's own signal support) — instead
 * of quietly finishing (and retrying) in the background. Without this,
 * rapid typing can pile up stale, still-running searches behind the
 * shared throttle queue, which can itself trip Tenrai's real rate limit
 * for the searches that actually still matter.
 *
 * Returns the full response envelope (data + pagination, when present) —
 * tenraiFetch() below is the common case that just wants `.data`.
 */
async function tenraiFetchRaw<T>(
	path: string,
	signal?: AbortSignal,
	retriesLeft = 2,
): Promise<{ data: T; pagination?: { has_next_page: boolean; current_page: number; last_visible_page: number } }> {
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
			return tenraiFetchRaw<T>(path, signal, retriesLeft - 1);
		}

		if (!res.ok) {
			throw new Error(`Tenrai ${path} failed: ${res.status} ${res.statusText}`);
		}
		return res.json();
	}, signal);
}

async function tenraiFetch<T>(path: string, signal?: AbortSignal, retriesLeft = 2): Promise<T> {
	const envelope = await tenraiFetchRaw<T>(path, signal, retriesLeft);
	return envelope.data;
}

// ============================================================================
// Raw response shapes (only the fields we use)
// ============================================================================

type TenraiImages = {
	jpg: { image_url: string | null; large_image_url: string | null };
};

type TenraiAnimeSearchRaw = {
	mal_id: number;
	title: string;
	title_english: string | null;
	images: TenraiImages;
	year: number | null;
};

type TenraiMangaSearchRaw = {
	mal_id: number;
	title: string;
	title_english: string | null;
	images: TenraiImages;
	published: { from: string | null };
};

type TenraiAnimeFullRaw = {
	mal_id: number;
	title: string; // MAL's "default" title — usually the romaji/native title, NOT English
	title_english: string | null;
	title_japanese: string | null;
	title_synonyms: string[];
	synopsis: string | null;
	images: TenraiImages;
	episodes: number | null;
	duration: string | null; // e.g. "24 min per ep" or "2 hr 5 min"
	studios: { name: string }[];
	source: string | null; // "Manga", "Light novel", "Original", etc.
	season: string | null; // "spring", "summer", ...
	year: number | null;
	status: string | null; // "Finished Airing", "Currently Airing"
	genres: { mal_id: number; name: string }[];
};

type TenraiMangaFullRaw = {
	mal_id: number;
	title: string; // same "default" caveat as anime — often romaji, not English
	title_english: string | null;
	title_japanese: string | null;
	title_synonyms: string[];
	synopsis: string | null;
	images: TenraiImages;
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

import type { TenraiSearchHit } from "$lib/types/search";

// ============================================================================
// Public: search
// ============================================================================

export async function searchAnime(query: string, signal?: AbortSignal): Promise<TenraiSearchHit[]> {
	if (!query.trim()) return [];

	const results = await tenraiFetch<TenraiAnimeSearchRaw[]>(
		`/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
		signal,
	);

	// Tenrai occasionally returns the same mal_id twice in one search
	// response — dedupe before mapping to avoid duplicate keys downstream.
	const seen = new Set<number>();
	const deduped = results.filter((r) => {
		if (seen.has(r.mal_id)) return false;
		seen.add(r.mal_id);
		return true;
	});

	return deduped.map(
		(r): TenraiSearchHit => ({
			type: "anime",
			id: r.mal_id,
			title: r.title_english || r.title,
			imageUrl: r.images.jpg.large_image_url ?? r.images.jpg.image_url,
			year: r.year,
		}),
	);
}

export async function searchManga(query: string, signal?: AbortSignal): Promise<TenraiSearchHit[]> {
	if (!query.trim()) return [];

	const results = await tenraiFetch<TenraiMangaSearchRaw[]>(
		`/manga?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
		signal,
	);

	// Same dedupe as searchAnime — Tenrai's search index can return a manga
	// twice (e.g. once for the main entry, once via a cross-reference).
	const seen = new Set<number>();
	const deduped = results.filter((r) => {
		if (seen.has(r.mal_id)) return false;
		seen.add(r.mal_id);
		return true;
	});

	return deduped.map(
		(r): TenraiSearchHit => ({
			type: "manga",
			id: r.mal_id,
			title: r.title_english || r.title,
			imageUrl: r.images.jpg.large_image_url ?? r.images.jpg.image_url,
			year: r.published.from ? new Date(r.published.from).getFullYear() : null,
		}),
	);
}

// ============================================================================
// Public: fetch full details (for import)
// ============================================================================

async function fetchAnimeDetails(malId: number): Promise<TenraiAnimeFullRaw> {
	return tenraiFetch<TenraiAnimeFullRaw>(`/anime/${malId}/full`);
}

async function fetchMangaDetails(malId: number): Promise<TenraiMangaFullRaw> {
	return tenraiFetch<TenraiMangaFullRaw>(`/manga/${malId}/full`);
}

// ============================================================================
// Duration parsing — Tenrai gives free-text like "24 min per ep" or
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

/**
 * MAL's "default" title (title) is usually the romaji/native title, not
 * English, unlike TMDB, which already gives you a localized title as primary.
 * Prefer title_english when available so anime/manga display consistently with
 * the rest of the catalog, and store the native title as originalTitle (same convention TMDB already uses).
 * When there's no English title at all, originalTitle stays null
 *
 * allVariants collects everything Tenrai knows this could be called, fed into findPossibleDuplicate() so
 * a cross-source match can be found even if the OTHER source's title doesn't line up with our chosen primary.
 */
function resolvePreferredTitle(raw: {
	title: string;
	title_english: string | null;
	title_japanese: string | null;
	title_synonyms: string[];
}): { primaryTitle: string; originalTitle: string | null; allVariants: string[] } {
	const primaryTitle = raw.title_english || raw.title;
	const originalTitle = raw.title_english ? raw.title : null;
	const allVariants = [raw.title_english, raw.title, raw.title_japanese, ...raw.title_synonyms].filter(
		(t): t is string => !!t?.trim(),
	);
	return { primaryTitle, originalTitle, allVariants };
}

export async function importAnime(malId: number, options?: { allowDuplicate?: boolean }): Promise<string> {
	const existing = await findExistingMediaId("mal", `anime:${malId}`);
	if (existing) return existing;

	const anime = await fetchAnimeDetails(malId);
	const releaseDate = anime.year ? `${anime.year}-01-01` : null;
	const { primaryTitle, originalTitle, allVariants } = resolvePreferredTitle(anime);

	if (!options?.allowDuplicate) {
		const duplicate = await findPossibleDuplicate(allVariants, releaseDate);
		if (duplicate) throw new PossibleDuplicateError(duplicate);
	}

	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(primaryTitle, anime.year, "anime", malId),
				mediaType: "anime",
				title: primaryTitle,
				originalTitle,
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
	const { primaryTitle, originalTitle } = resolvePreferredTitle(manga);

	return db.transaction(async (tx) => {
		const releaseDate = manga.published.from ? manga.published.from.slice(0, 10) : null;

		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(primaryTitle, releaseDate?.slice(0, 4), "manga", malId),
				mediaType: "manga",
				title: primaryTitle,
				originalTitle,
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

type TenraiEpisodeRaw = {
	mal_id: number; // this IS the episode number in this endpoint's context
	title: string;
	aired: string | null;
	filler: boolean;
	recap: boolean;
};

async function fetchAnimeEpisodes(malId: number): Promise<TenraiEpisodeRaw[]> {
	// Tenrai paginates this endpoint at 100/page.
	// Long-running shows (i.e. One Piece) can have 1000+ episodes, so a single-page fetch silently truncated most of the list
	// This loops until the API itself reports no more pages.
	const MAX_PAGES = 50; // 5000 episodes — comfortably above any real anime,

	const all: TenraiEpisodeRaw[] = [];
	let page = 1;

	while (page <= MAX_PAGES) {
		const envelope = await tenraiFetchRaw<TenraiEpisodeRaw[]>(`/anime/${malId}/episodes?page=${page}`);
		all.push(...envelope.data);

		if (!envelope.pagination?.has_next_page) break;
		page++;
	}

	return all;
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
