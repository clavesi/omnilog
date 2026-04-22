import { and, eq } from "drizzle-orm";
import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import {
	genres,
	type MovieMetadata,
	mediaExternalIds,
	mediaGenres,
	mediaItems,
	mediaMetadata,
	type TvMetadata,
} from "$lib/server/db/schema";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";
if (!env.TMDB_API_KEY) throw new Error("TMDB_API_KEY is not set");
const TMDB_API_KEY = env.TMDB_API_KEY;

// ============================================================================
// TYPES — only what we use from TMDB, not their full schema
// ============================================================================

export type TmdbSearchHit =
	| {
			type: "movie";
			id: number;
			title: string;
			original_title: string;
			overview: string;
			release_date: string; // "YYYY-MM-DD" or ""
			poster_path: string | null;
			backdrop_path: string | null;
			vote_average: number;
	  }
	| {
			type: "tv";
			id: number;
			name: string;
			original_name: string;
			overview: string;
			first_air_date: string;
			poster_path: string | null;
			backdrop_path: string | null;
			vote_average: number;
	  };

type TmdbMovieDetails = {
	id: number;
	title: string;
	original_title: string;
	overview: string;
	release_date: string;
	poster_path: string | null;
	backdrop_path: string | null;
	vote_average: number;
	runtime: number | null;
	genres: { id: number; name: string }[];
	original_language: string;
	status: string;
	tagline: string | null;
};

type TmdbTvDetails = {
	id: number;
	name: string;
	original_name: string;
	overview: string;
	first_air_date: string;
	poster_path: string | null;
	backdrop_path: string | null;
	vote_average: number;
	number_of_seasons: number | null;
	number_of_episodes: number | null;
	episode_run_time: number[];
	genres: { id: number; name: string }[];
	original_language: string;
	status: string;
};

// ============================================================================
// Low-level fetch with simple in-memory cache
// ============================================================================

type CacheEntry = { value: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — TMDB data rarely changes

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	const url = new URL(`${TMDB_BASE}${path}`);
	url.searchParams.set("api_key", TMDB_API_KEY);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

	const cacheKey = url.toString();
	const cached = cache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.value as T;
	}

	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) {
		throw new Error(`TMDB ${path} failed: ${res.status} ${res.statusText}`);
	}
	const value = (await res.json()) as T;

	cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
	// Lazy eviction — cap size so we don't leak memory over a long server life.
	if (cache.size > 500) {
		const firstKey = cache.keys().next().value;
		if (firstKey) cache.delete(firstKey);
	}

	return value;
}

// ============================================================================
// Public: search
// ============================================================================

/**
 * Multi-search across movies + TV. Returns up to 10 hits, filtering out
 * people and preferring results with posters. Results are live from TMDB,
 * not from your DB.
 */
export async function searchMoviesAndTv(query: string): Promise<TmdbSearchHit[]> {
	if (!query.trim()) return [];

	const data = await tmdb<{
		results: Array<{
			media_type: "movie" | "tv" | "person";
			[key: string]: unknown;
		}>;
	}>("/search/multi", {
		query,
		include_adult: "false",
	});

	const hits: TmdbSearchHit[] = [];
	for (const r of data.results) {
		if (r.media_type === "movie") {
			hits.push({
				type: "movie",
				id: r.id as number,
				title: r.title as string,
				original_title: r.original_title as string,
				overview: (r.overview as string) ?? "",
				release_date: (r.release_date as string) ?? "",
				poster_path: (r.poster_path as string | null) ?? null,
				backdrop_path: (r.backdrop_path as string | null) ?? null,
				vote_average: (r.vote_average as number) ?? 0,
			});
		} else if (r.media_type === "tv") {
			hits.push({
				type: "tv",
				id: r.id as number,
				name: r.name as string,
				original_name: r.original_name as string,
				overview: (r.overview as string) ?? "",
				first_air_date: (r.first_air_date as string) ?? "",
				poster_path: (r.poster_path as string | null) ?? null,
				backdrop_path: (r.backdrop_path as string | null) ?? null,
				vote_average: (r.vote_average as number) ?? 0,
			});
		}
		// skip people
	}

	// Prefer results with posters — drops a lot of garbage early entries.
	hits.sort((a, b) => {
		if (!!a.poster_path !== !!b.poster_path) return a.poster_path ? -1 : 1;
		return 0;
	});

	return hits.slice(0, 10);
}

// ============================================================================
// Public: fetch details (for preview pages)
// ============================================================================

export async function fetchMovieDetails(tmdbId: number) {
	return tmdb<TmdbMovieDetails>(`/movie/${tmdbId}`);
}

export async function fetchTvDetails(tmdbId: number) {
	return tmdb<TmdbTvDetails>(`/tv/${tmdbId}`);
}

// ============================================================================
// Image URL helper (pure — safe to import from client code)
// ============================================================================

export function tmdbImage(path: string | null, size: "w185" | "w342" | "w500" | "original" = "w342"): string | null {
	return path ? `${TMDB_IMAGE}/${size}${path}` : null;
}

// ============================================================================
// Import: movie
// ============================================================================

/**
 * Idempotent movie import. Returns the internal media_items.id.
 *
 * If the movie is already in the DB (keyed on tmdb id via media_external_ids),
 * returns its existing id without re-inserting.
 */
export async function importMovie(tmdbId: number): Promise<string> {
	const existing = await findExistingMediaId("tmdb", `movie:${tmdbId}`);
	if (existing) return existing;

	const movie = await fetchMovieDetails(tmdbId);

	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(movie.title, movie.release_date, "movie", tmdbId),
				mediaType: "movie",
				title: movie.title,
				originalTitle: movie.original_title || null,
				description: movie.overview || null,
				releaseDate: movie.release_date || null,
				coverImageUrl: tmdbImage(movie.poster_path, "w500"),
				backdropImageUrl: tmdbImage(movie.backdrop_path, "original"),
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "tmdb",
			externalId: `movie:${tmdbId}`,
			url: `https://www.themoviedb.org/movie/${tmdbId}`,
		});

		const metadata: MovieMetadata = {
			type: "movie",
			runtime: movie.runtime,
			original_language: movie.original_language || null,
			tagline: movie.tagline,
			status: movie.status || null,
			tmdb_vote_average: movie.vote_average,
		};

		await tx.insert(mediaMetadata).values({
			mediaItemId,
			metadata,
		});

		await linkGenres(tx, mediaItemId, movie.genres);

		return mediaItemId;
	});
}

// ============================================================================
// Import: TV
// ============================================================================

export async function importTv(tmdbId: number): Promise<string> {
	const existing = await findExistingMediaId("tmdb", `tv:${tmdbId}`);
	if (existing) return existing;

	const show = await fetchTvDetails(tmdbId);

	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(show.name, show.first_air_date, "tv", tmdbId),
				mediaType: "tv",
				title: show.name,
				originalTitle: show.original_name || null,
				description: show.overview || null,
				releaseDate: show.first_air_date || null,
				coverImageUrl: tmdbImage(show.poster_path, "w500"),
				backdropImageUrl: tmdbImage(show.backdrop_path, "original"),
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "tmdb",
			externalId: `tv:${tmdbId}`,
			url: `https://www.themoviedb.org/tv/${tmdbId}`,
		});

		const metadata: TvMetadata = {
			type: "tv",
			number_of_seasons: show.number_of_seasons,
			number_of_episodes: show.number_of_episodes,
			episode_run_time: show.episode_run_time?.length ? show.episode_run_time : null,
			original_language: show.original_language || null,
			status: show.status || null,
			tmdb_vote_average: show.vote_average,
		};

		await tx.insert(mediaMetadata).values({
			mediaItemId,
			metadata,
		});

		await linkGenres(tx, mediaItemId, show.genres);

		return mediaItemId;
	});
}

// ============================================================================
// Shared import helpers
// ============================================================================

/**
 * Movies are keyed as "movie:<id>" and TV as "tv:<id>" within the tmdb source.
 * TMDB reuses integer IDs across movies and TV (movie 1 and show 1 both
 * exist), so a bare id would collide.
 */
async function findExistingMediaId(source: "tmdb", externalId: string): Promise<string | null> {
	const rows = await db
		.select({ mediaItemId: mediaExternalIds.mediaItemId })
		.from(mediaExternalIds)
		.where(and(eq(mediaExternalIds.source, source), eq(mediaExternalIds.externalId, externalId)))
		.limit(1);
	return rows[0]?.mediaItemId ?? null;
}

async function linkGenres(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	mediaItemId: string,
	tmdbGenres: { id: number; name: string }[],
) {
	for (const g of tmdbGenres) {
		const slug = slugify(g.name);
		const [genre] = await tx
			.insert(genres)
			.values({ name: g.name, slug })
			.onConflictDoUpdate({ target: genres.slug, set: { name: g.name } })
			.returning({ id: genres.id });

		await tx.insert(mediaGenres).values({ mediaItemId, genreId: genre.id }).onConflictDoNothing();
	}
}

function slugify(s: string): string {
	return s
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function buildSlug(title: string, date: string, type: "movie" | "tv", tmdbId: number): string {
	const year = date?.slice(0, 4) || "unknown";
	return `${slugify(title)}-${year}-${type}-${tmdbId}`;
}
