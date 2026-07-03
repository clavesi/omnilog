import { error } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { genres, logs, mediaGenres, mediaItems, mediaMetadata, users } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db.select().from(mediaItems).where(eq(mediaItems.slug, params.slug)).limit(1);

	if (!item) throw error(404, "Not found");

	const [meta] = await db.select().from(mediaMetadata).where(eq(mediaMetadata.mediaItemId, item.id)).limit(1);

	const itemGenres = await db
		.select({ name: genres.name, slug: genres.slug })
		.from(mediaGenres)
		.innerJoin(genres, eq(mediaGenres.genreId, genres.id))
		.where(eq(mediaGenres.mediaItemId, item.id));

	// Recent logs for this item, across all users, newest first.
	const recentLogs = await db
		.select({
			id: logs.id,
			userId: logs.userId,
			rating: logs.rating,
			reviewTitle: logs.reviewTitle,
			reviewBody: logs.reviewBody,
			containsSpoilers: logs.containsSpoilers,
			isRewatch: logs.isRewatch,
			loggedAt: logs.loggedAt,
			createdAt: logs.createdAt,
			username: users.username,
		})
		.from(logs)
		.innerJoin(users, eq(logs.userId, users.id))
		.where(eq(logs.mediaItemId, item.id))
		.orderBy(desc(logs.createdAt))
		.limit(20);

	// Attach mediaSlug/Title/Cover manually since LogCard expects them —
	// we already have `item` here, no need to re-join.
	const logsWithMedia = recentLogs.map((l) => ({
		...l,
		mediaSlug: item.slug,
		mediaTitle: item.title,
		mediaCoverUrl: item.coverImageUrl,
	}));

	return {
		item,
		metadata: meta?.metadata ?? null,
		genres: itemGenres,
		logs: logsWithMedia,
		currentUserId: locals.user?.id ?? null,
	};
};
