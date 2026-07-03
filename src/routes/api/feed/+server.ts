import { json } from "@sveltejs/kit";
import { getFeedPage } from "$lib/server/feed";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const cursor = url.searchParams.get("cursor");
	const page = await getFeedPage({ cursorRaw: cursor });
	return json(page);
};
