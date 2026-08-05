import { json } from "@sveltejs/kit";
import { searchGames } from "$lib/server/igdb";
import { searchAlbums } from "$lib/server/musicbrainz";
import { searchBooks } from "$lib/server/openlibrary";
import { searchAnime, searchManga } from "$lib/server/tenrai";
import { searchMoviesAndTv, searchMoviesOnly, searchTvOnly } from "$lib/server/tmdb";
import { upstreamMessageOf } from "$lib/server/upstream-error";
import {
	type MusicPrimaryType,
	type SearchHit,
	type SearchType,
	VALID_MUSIC_PRIMARY_TYPES,
	VALID_SEARCH_TYPES,
} from "$lib/types/search";
import type { RequestHandler } from "./$types";

function isSearchType(v: string | null): v is SearchType {
	return VALID_SEARCH_TYPES.includes(v as SearchType);
}

function isMusicPrimaryType(v: string | null): v is MusicPrimaryType {
	return VALID_MUSIC_PRIMARY_TYPES.includes(v as MusicPrimaryType);
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

	// Only meaningful when type === "music"; ignored otherwise.
	const musicTypeParam = url.searchParams.get("musicType");
	const musicPrimaryType: MusicPrimaryType = isMusicPrimaryType(musicTypeParam) ? musicTypeParam : "all";

	async function single(fn: () => Promise<SearchHit[]>, label: string) {
		try {
			return json({ results: await fn() });
		} catch (err) {
			if (isAbortError(err)) {
				// Expected whenever a newer keystroke supersedes this search
				return json({ results: [] });
			}
			console.error(`${label} search failed`, err);
			// Prefer the provider's own explanation — it's usually specific
			// ("q must be at least 3 characters") where ours can only be vague.
			const detail = upstreamMessageOf(err);
			return json({ results: [], error: detail ?? `${label} search failed` }, { status: 500 });
		}
	}

	if (type === "movie") return single(() => searchMoviesOnly(q, signal), "TMDB movie");
	if (type === "tv") return single(() => searchTvOnly(q, signal), "TMDB tv");
	if (type === "game") return single(() => searchGames(q, signal), "IGDB");
	if (type === "anime") return single(() => searchAnime(q, signal), "Tenrai anime");
	if (type === "manga") return single(() => searchManga(q, signal), "Tenrai manga");
	if (type === "music") return single(() => searchAlbums(q, signal, { primaryType: musicPrimaryType }), "MusicBrainz");
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

		// Everything failed. If any source explained itself, that beats a
		// generic message even though other sources may have failed differently.
		const detail = sources
			.map((s) => (s.status === "rejected" ? upstreamMessageOf(s.reason) : null))
			.find((m): m is string => m !== null);
		return json({ results: [], error: detail ?? "search failed" }, { status: 500 });
	}

	return json({ results });
};
