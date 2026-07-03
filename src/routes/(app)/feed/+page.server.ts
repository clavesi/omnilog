import { requireUser } from "$lib/server/auth";
import { getFeedPage } from "$lib/server/feed";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event); // feed is the post-login landing page — keep it gated
	const page = await getFeedPage();
	return { initialLogs: page.logs, initialCursor: page.nextCursor, currentUserId: user.id };
};
