import { json } from "@sveltejs/kit";
import { getFeedPage, getPersonalizedFeedPage } from "$lib/server/feed";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
	const cursor = url.searchParams.get("cursor");

	// Without this, "load more" on a personalized feed returned global results (including the viewer's own logs).
	if (locals.user) {
		const page = await getPersonalizedFeedPage(locals.user.id, {
			cursorRaw: cursor,
			excludeUserId: locals.user.id,
		});
		return json(page);
	}

	const page = await getFeedPage({ cursorRaw: cursor });
	return json(page);
};
