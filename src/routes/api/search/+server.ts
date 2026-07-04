import { json } from "@sveltejs/kit";
import { searchGames } from "$lib/server/igdb";
import { searchMoviesAndTv, searchMoviesOnly, searchTvOnly } from "$lib/server/tmdb";
import type { RequestHandler } from "./$types";

type SearchType = "all" | "movie" | "tv" | "game";

function isSearchType(v: string | null): v is SearchType {
	return v === "all" || v === "movie" || v === "tv" || v === "game";
}

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) return json({ results: [] });

	const typeParam = url.searchParams.get("type");
	const type: SearchType = isSearchType(typeParam) ? typeParam : "all";

	// Only query the source(s) actually needed for the requested type —
	// no point paying the IGDB round-trip if the user filtered to "Movies".
	if (type === "movie") {
		try {
			return json({ results: await searchMoviesOnly(q) });
		} catch (err) {
			console.error("TMDB movie search failed", err);
			return json({ results: [], error: "search failed" }, { status: 500 });
		}
	}

	if (type === "tv") {
		try {
			return json({ results: await searchTvOnly(q) });
		} catch (err) {
			console.error("TMDB tv search failed", err);
			return json({ results: [], error: "search failed" }, { status: 500 });
		}
	}

	if (type === "game") {
		try {
			return json({ results: await searchGames(q) });
		} catch (err) {
			console.error("IGDB search failed", err);
			return json({ results: [], error: "search failed" }, { status: 500 });
		}
	}

	// type === "all" — query everything in parallel, degrade gracefully if
	// one source fails rather than erroring the whole search.
	const [tmdbResult, igdbResult] = await Promise.allSettled([searchMoviesAndTv(q), searchGames(q)]);

	const results = [
		...(tmdbResult.status === "fulfilled" ? tmdbResult.value : []),
		...(igdbResult.status === "fulfilled" ? igdbResult.value : []),
	];

	if (tmdbResult.status === "rejected") console.error("TMDB search failed", tmdbResult.reason);
	if (igdbResult.status === "rejected") console.error("IGDB search failed", igdbResult.reason);

	if (tmdbResult.status === "rejected" && igdbResult.status === "rejected") {
		return json({ results: [], error: "search failed" }, { status: 500 });
	}

	return json({ results });
};
