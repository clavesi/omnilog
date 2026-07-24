import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs, users } from "$lib/server/db/schema";
import { getShowcaseForUser } from "$lib/server/favorites";
import { getListsForUser } from "$lib/server/lists";
import { queryLogsWithMedia } from "$lib/server/logs";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [profileUser] = await db
		.select({
			id: users.id,
			username: users.username,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
		})
		.from(users)
		.where(eq(users.username, params.username))
		.limit(1);

	if (!profileUser) throw error(404, "User not found");

	const isOwnProfile = locals.user?.id === profileUser.id;

	// Own profile shows all logs; others see only public entries.
	const rows = await queryLogsWithMedia({
		where: isOwnProfile
			? eq(logs.userId, profileUser.id)
			: and(eq(logs.userId, profileUser.id), eq(logs.isPublic, true)),
		limit: 50,
	});

	const showcase = await getShowcaseForUser(profileUser.id);
	const lists = await getListsForUser(profileUser.id, isOwnProfile);

	return {
		profileUser,
		logs: rows,
		showcase,
		lists,
		isOwnProfile,
	};
};
