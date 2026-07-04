// src/routes/api/search/+server.ts
import { json } from "@sveltejs/kit";
import { type IgdbSearchHit, searchGames } from "$lib/server/igdb";
import { type JikanSearchHit, searchAnime, searchManga } from "$lib/server/jikan";
import { searchMoviesAndTv, searchMoviesOnly, searchTvOnly, type TmdbSearchHit } from "$lib/server/tmdb";
import type { RequestHandler } from "./$types";

type SearchHit = TmdbSearchHit | IgdbSearchHit | JikanSearchHit;
type SearchType = "all" | "movie" | "tv" | "game" | "anime" | "manga";

const VALID_TYPES: SearchType[] = ["all", "movie", "tv", "game", "anime", "manga"];

function isSearchType(v: string | null): v is SearchType {
	return VALID_TYPES.includes(v as SearchType);
}

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) return json({ results: [] });

	const typeParam = url.searchParams.get("type");
	const type: SearchType = isSearchType(typeParam) ? typeParam : "all";

	async function single(fn: () => Promise<unknown[]>, label: string) {
		try {
			return json({ results: await fn() });
		} catch (err) {
			console.error(`${label} search failed`, err);
			return json({ results: [], error: "search failed" }, { status: 500 });
		}
	}

	if (type === "movie") return single(() => searchMoviesOnly(q), "TMDB movie");
	if (type === "tv") return single(() => searchTvOnly(q), "TMDB tv");
	if (type === "game") return single(() => searchGames(q), "IGDB");
	if (type === "anime") return single(() => searchAnime(q), "Jikan anime");
	if (type === "manga") return single(() => searchManga(q), "Jikan manga");

	// type === "all" — query everything in parallel, degrade gracefully
	// if any individual source fails.
	const sources = await Promise.allSettled<SearchHit[]>([
		searchMoviesAndTv(q),
		searchGames(q),
		searchAnime(q),
		searchManga(q),
	]);

	const labels = ["TMDB", "IGDB", "Jikan anime", "Jikan manga"];
	const results = sources.flatMap((s) => (s.status === "fulfilled" ? s.value : []));

	sources.forEach((s, i) => {
		if (s.status === "rejected") console.error(`${labels[i]} search failed`, s.reason);
	});

	if (sources.every((s) => s.status === "rejected")) {
		return json({ results: [], error: "search failed" }, { status: 500 });
	}

	return json({ results });
};
