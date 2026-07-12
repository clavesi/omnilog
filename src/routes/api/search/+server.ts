import { json } from "@sveltejs/kit";
import { type IgdbSearchHit, searchGames } from "$lib/server/igdb";
import { type JikanSearchHit, searchAnime, searchManga } from "$lib/server/jikan";
import { type MusicBrainzSearchHit, searchAlbums } from "$lib/server/musicbrainz";
import { type OpenLibrarySearchHit, searchBooks } from "$lib/server/openlibrary";
import { searchMoviesAndTv, searchMoviesOnly, searchTvOnly, type TmdbSearchHit } from "$lib/server/tmdb";
import type { RequestHandler } from "./$types";

type SearchHit = TmdbSearchHit | IgdbSearchHit | JikanSearchHit | MusicBrainzSearchHit | OpenLibrarySearchHit;
type SearchType = "all" | "movie" | "tv" | "game" | "anime" | "manga" | "music" | "book";

const VALID_TYPES: SearchType[] = ["all", "movie", "tv", "game", "anime", "manga", "music", "book"];

function isSearchType(v: string | null): v is SearchType {
	return VALID_TYPES.includes(v as SearchType);
}

function isAbortError(err: unknown): boolean {
	return err instanceof DOMException && err.name === "AbortError";
}

export const GET: RequestHandler = async ({ url, request }) => {
	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) return json({ results: [] });

	const typeParam = url.searchParams.get("type");
	const type: SearchType = isSearchType(typeParam) ? typeParam : "all";

	// Propagated down into each source's outbound fetch (Tenrai currently,
	// the others are a natural follow-up). When the client's connection
	// drops — e.g. a newer typeahead keystroke superseded this search —
	// this lets in-flight or still-queued requests actually stop instead
	// of quietly finishing (and retrying) in the background, which is what
	// was piling up behind Tenrai's shared throttle and eventually tripping
	// its real rate limit for searches that still mattered.
	const signal = request.signal;

	async function single(fn: () => Promise<SearchHit[]>, label: string) {
		try {
			return json({ results: await fn() });
		} catch (err) {
			if (isAbortError(err)) throw err; // expected on cancellation, don't log as an error
			console.error(`${label} search failed`, err);
			return json({ results: [], error: "search failed" }, { status: 500 });
		}
	}

	if (type === "movie") return single(() => searchMoviesOnly(q), "TMDB movie");
	if (type === "tv") return single(() => searchTvOnly(q), "TMDB tv");
	if (type === "game") return single(() => searchGames(q), "IGDB");
	if (type === "anime") return single(() => searchAnime(q, signal), "Tenrai anime");
	if (type === "manga") return single(() => searchManga(q, signal), "Tenrai manga");
	if (type === "music") return single(() => searchAlbums(q), "MusicBrainz");
	if (type === "book") return single(() => searchBooks(q), "Open Library");

	// type === "all" — query everything in parallel, degrade gracefully
	// if any individual source fails.
	const sources = await Promise.allSettled([
		searchMoviesAndTv(q),
		searchGames(q),
		searchAnime(q, signal),
		searchManga(q, signal),
		searchAlbums(q),
		searchBooks(q),
	]);

	const labels = ["TMDB", "IGDB", "Tenrai anime", "Tenrai manga", "MusicBrainz", "Open Library"];

	const results = sources.flatMap<SearchHit>((s) => (s.status === "fulfilled" ? s.value : []));

	sources.forEach((s, i) => {
		if (s.status === "rejected" && !isAbortError(s.reason)) {
			console.error(`${labels[i]} search failed`, s.reason);
		}
	});

	if (sources.every((s) => s.status === "rejected")) {
		return json({ results: [], error: "search failed" }, { status: 500 });
	}

	return json({ results });
};
