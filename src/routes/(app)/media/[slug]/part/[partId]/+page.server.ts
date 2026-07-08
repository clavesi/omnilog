import { error } from "@sveltejs/kit";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs, mediaItems, mediaParts, users } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			coverImageUrl: mediaItems.coverImageUrl,
			mediaType: mediaItems.mediaType,
		})
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Media not found");

	const [part] = await db
		.select()
		.from(mediaParts)
		.where(and(eq(mediaParts.id, params.partId), eq(mediaParts.mediaItemId, item.id)))
		.limit(1);

	if (!part) throw error(404, "Part not found");

	// If this episode belongs to a season (TV), fetch the season for the
	// "back to season" link. Anime episodes have no parent, so this is null.
	let season: { id: string; partNumber: number } | null = null;
	if (part.parentPartId) {
		const [s] = await db
			.select({ id: mediaParts.id, partNumber: mediaParts.partNumber })
			.from(mediaParts)
			.where(eq(mediaParts.id, part.parentPartId))
			.limit(1);
		season = s?.partNumber != null ? { id: s.id, partNumber: s.partNumber } : null;
	}

	const currentUserId = locals.user?.id ?? null;

	// Same visibility rule as the media item page: public logs from everyone,
	// plus the viewer's own log even if private.
	const rows = await db
		.select({
			id: logs.id,
			userId: logs.userId,
			rating: logs.rating,
			reviewTitle: logs.reviewTitle,
			reviewBody: logs.reviewBody,
			containsSpoilers: logs.containsSpoilers,
			isRewatch: logs.isRewatch,
			isPublic: logs.isPublic,
			loggedAt: logs.loggedAt,
			createdAt: logs.createdAt,
			username: users.username,
		})
		.from(logs)
		.innerJoin(users, eq(logs.userId, users.id))
		.where(
			and(
				eq(logs.mediaPartId, part.id),
				currentUserId ? or(eq(logs.isPublic, true), eq(logs.userId, currentUserId)) : eq(logs.isPublic, true),
			),
		)
		.orderBy(desc(logs.createdAt));

	const partLogs = rows.map((l) => ({
		...l,
		mediaPartId: part.id,
		mediaSlug: item.slug,
		mediaTitle: item.title,
		mediaCoverUrl: item.coverImageUrl,
	}));

	return {
		item,
		part,
		season,
		logs: partLogs,
		currentUserId,
	};
};
