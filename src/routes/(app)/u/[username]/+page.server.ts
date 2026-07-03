import { error } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { logs, mediaItems, users } from "$lib/server/db/schema";

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

	const rows = await db
		.select({
			id: logs.id,
			rating: logs.rating,
			reviewTitle: logs.reviewTitle,
			reviewBody: logs.reviewBody,
			containsSpoilers: logs.containsSpoilers,
			isRewatch: logs.isRewatch,
			loggedAt: logs.loggedAt,
			createdAt: logs.createdAt,
			mediaSlug: mediaItems.slug,
			mediaTitle: mediaItems.title,
			mediaCoverUrl: mediaItems.coverImageUrl,
		})
		.from(logs)
		.innerJoin(mediaItems, eq(logs.mediaItemId, mediaItems.id))
		.where(eq(logs.userId, profileUser.id))
		.orderBy(desc(logs.createdAt))
		.limit(50);

	const isOwnProfile = locals.user?.id === profileUser.id;

	return {
		profileUser,
		logs: rows,
		isOwnProfile,
	};
};
