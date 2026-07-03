import { error } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs, mediaItems, users } from "$lib/server/db/schema";
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
		.where(
			isOwnProfile ? eq(logs.userId, profileUser.id) : and(eq(logs.userId, profileUser.id), eq(logs.isPublic, true)),
		)
		.orderBy(desc(logs.createdAt))
		.limit(50);

	return {
		profileUser,
		logs: rows,
		isOwnProfile,
	};
};
