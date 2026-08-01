import { requireUser } from "$lib/server/auth";
import { getPersonalizedFeedPage } from "$lib/server/feed";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const page = await getPersonalizedFeedPage(user.id, { excludeUserId: user.id });
	return {
		initialLogs: page.logs,
		initialCursor: page.nextCursor,
		currentUserId: user.id,
		isPersonalized: page.isPersonalized,
	};
};
