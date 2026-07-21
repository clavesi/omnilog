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

	// Propagated down into each source's outbound fetch. When the client's connection drops
	//   e.g. a newer typeahead keystroke superseded this search
	// this lets in-flight or still-queued requests actually stop instead of quietly finishing (and retrying) in the background.
	const signal = request.signal;

	async function single(fn: () => Promise<SearchHit[]>, label: string) {
		try {
			return json({ results: await fn() });
		} catch (err) {
			if (isAbortError(err)) {
				// Expected whenever a newer keystroke supersedes this search
				return json({ results: [] });
			}
			console.error(`${label} search failed`, err);
			return json({ results: [], error: "search failed" }, { status: 500 });
		}
	}

	if (type === "movie") return single(() => searchMoviesOnly(q, signal), "TMDB movie");
	if (type === "tv") return single(() => searchTvOnly(q, signal), "TMDB tv");
	if (type === "game") return single(() => searchGames(q, signal), "IGDB");
	if (type === "anime") return single(() => searchAnime(q, signal), "Tenrai anime");
	if (type === "manga") return single(() => searchManga(q, signal), "Tenrai manga");
	if (type === "music") return single(() => searchAlbums(q, signal), "MusicBrainz");
	if (type === "book") return single(() => searchBooks(q, signal), "Open Library");

	// type === "all" — query everything in parallel, degrade gracefully
	// if any individual source fails.
	const sources = await Promise.allSettled([
		searchMoviesAndTv(q, signal),
		searchGames(q, signal),
		searchAnime(q, signal),
		searchManga(q, signal),
		searchAlbums(q, signal),
		searchBooks(q, signal),
	]);

	const labels = ["TMDB", "IGDB", "Tenrai anime", "Tenrai manga", "MusicBrainz", "Open Library"];

	const results = sources.flatMap<SearchHit>((s) => (s.status === "fulfilled" ? s.value : []));

	sources.forEach((s, i) => {
		if (s.status === "rejected" && !isAbortError(s.reason)) {
			console.error(`${labels[i]} search failed`, s.reason);
		}
	});

	if (sources.every((s) => s.status === "rejected")) {
		// If every rejection was just an abort (superseded search), that's not a real failure.
		// Only surface 500 if something actually broke.
		const allAborted = sources.every((s) => s.status === "rejected" && isAbortError(s.reason));
		if (allAborted) return json({ results: [] });
		return json({ results: [], error: "search failed" }, { status: 500 });
	}

	return json({ results });
};
