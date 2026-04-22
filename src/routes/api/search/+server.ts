import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchMoviesAndTv } from "$lib/server/tmdb";

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) return json({ results: [] });

	try {
		const results = await searchMoviesAndTv(q);
		return json({ results });
	} catch (err) {
		console.error("search failed", err);
		return json({ results: [], error: "search failed" }, { status: 500 });
	}
};
