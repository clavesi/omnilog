// src/routes/api/search/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchMoviesAndTv } from "$lib/server/tmdb";
import { searchGames } from "$lib/server/igdb";

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) return json({ results: [] });

	// Query both sources in parallel. If one fails (e.g. IGDB token issue),
	// don't let it kill the whole search — fall back to whatever succeeded.
	const [tmdbResult, igdbResult] = await Promise.allSettled([searchMoviesAndTv(q), searchGames(q)]);

	const results = [
		...(tmdbResult.status === "fulfilled" ? tmdbResult.value : []),
		...(igdbResult.status === "fulfilled" ? igdbResult.value : []),
	];

	if (tmdbResult.status === "rejected") {
		console.error("TMDB search failed", tmdbResult.reason);
	}
	if (igdbResult.status === "rejected") {
		console.error("IGDB search failed", igdbResult.reason);
	}

	// If EVERY source failed, that's a real error worth surfacing.
	if (tmdbResult.status === "rejected" && igdbResult.status === "rejected") {
		return json({ results: [], error: "search failed" }, { status: 500 });
	}

	return json({ results });
};
