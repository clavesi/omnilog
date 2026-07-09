import { and, count, desc, eq, or, type SQL } from "drizzle-orm";
import type { LogCardData } from "$lib/types/log";
import { db } from "./db";
import { logs, mediaParts, users } from "./db/schema";
import { directMedia, logMediaSelect, parentPart, partMedia } from "./log-media-joins";

/** Core log columns shared by LogCard — keep in sync with LogCardData. */
export const logCardSelect = {
	id: logs.id,
	userId: logs.userId,
	rating: logs.rating,
	reviewTitle: logs.reviewTitle,
	reviewBody: logs.reviewBody,
	containsSpoilers: logs.containsSpoilers,
	isRewatch: logs.isRewatch,
	watchNumber: logs.watchNumber,
	isPublic: logs.isPublic,
	mediaPartId: logs.mediaPartId,
	loggedAt: logs.loggedAt,
	createdAt: logs.createdAt,
};

export type ItemMediaContext = {
	slug: string;
	title: string;
	coverImageUrl: string | null;
	mediaType?: string | null;
};

export type PartMediaContext = {
	id: string;
	partNumber: number | null;
	title: string | null;
	seasonNumber?: number | null;
};

/** Public logs for everyone; include the viewer's own private logs when signed in. */
export function logVisibilityCondition(currentUserId: string | null): SQL {
	if (!currentUserId) return eq(logs.isPublic, true);
	const condition = or(eq(logs.isPublic, true), eq(logs.userId, currentUserId));
	return condition ?? eq(logs.isPublic, true);
}

export async function countUserLogsForItem(userId: string, mediaItemId: string) {
	const [row] = await db
		.select({ n: count() })
		.from(logs)
		.where(and(eq(logs.userId, userId), eq(logs.mediaItemId, mediaItemId)));
	return row?.n ?? 0;
}

export async function countUserLogsForPart(userId: string, mediaPartId: string) {
	const [row] = await db
		.select({ n: count() })
		.from(logs)
		.where(and(eq(logs.userId, userId), eq(logs.mediaPartId, mediaPartId)));
	return row?.n ?? 0;
}

/**
 * Maps raw log rows to LogCardData when the page already loaded the media item.
 * Avoids re-joining media_items when we already have slug/title/cover in memory
 * (media detail, part detail pages).
 */
export function attachItemMedia<
	T extends {
		id: string;
		userId?: string;
		rating: number | null;
		reviewTitle: string | null;
		reviewBody: string | null;
		containsSpoilers: boolean;
		isRewatch: boolean;
		watchNumber: number;
		isPublic: boolean;
		mediaPartId?: string | null;
		loggedAt: string | null;
		createdAt: string | Date;
		username?: string;
	},
>(rows: T[], item: ItemMediaContext, part?: PartMediaContext): LogCardData[] {
	return rows.map((row) => ({
		...row,
		mediaPartId: row.mediaPartId ?? part?.id ?? null,
		mediaSlug: item.slug,
		mediaTitle: item.title,
		mediaCoverUrl: item.coverImageUrl,
		mediaType: item.mediaType,
		partTitle: part?.title,
		partNumber: part?.partNumber,
		seasonNumber: part?.seasonNumber,
	}));
}

export async function getLogsForMediaItem(
	mediaItemId: string,
	currentUserId: string | null,
	item: ItemMediaContext,
	limit = 20,
) {
	const rows = await db
		.select({ ...logCardSelect, username: users.username })
		.from(logs)
		.innerJoin(users, eq(logs.userId, users.id))
		.where(and(eq(logs.mediaItemId, mediaItemId), logVisibilityCondition(currentUserId)))
		.orderBy(desc(logs.createdAt))
		.limit(limit);

	return attachItemMedia(rows, item);
}

export async function getLogsForPart(
	partId: string,
	currentUserId: string | null,
	item: ItemMediaContext,
	part: PartMediaContext,
) {
	const rows = await db
		.select({ ...logCardSelect, username: users.username })
		.from(logs)
		.innerJoin(users, eq(logs.userId, users.id))
		.where(and(eq(logs.mediaPartId, partId), logVisibilityCondition(currentUserId)))
		.orderBy(desc(logs.createdAt));

	return attachItemMedia(rows, item, part);
}

/**
 * Logs that may target different media items — uses log-media-joins to resolve
 * slug/title/cover per row. Used for profile (and feed uses the same joins inline
 * because it needs cursor pagination).
 */
export async function queryLogsWithMedia(opts: { where: SQL | undefined; limit?: number; withUsername?: boolean }) {
	return db
		.select({
			...logCardSelect,
			...(opts.withUsername ? { username: users.username } : {}),
			...logMediaSelect,
		})
		.from(logs)
		.leftJoin(directMedia, eq(logs.mediaItemId, directMedia.id))
		.leftJoin(mediaParts, eq(logs.mediaPartId, mediaParts.id))
		.leftJoin(partMedia, eq(mediaParts.mediaItemId, partMedia.id))
		.leftJoin(parentPart, eq(mediaParts.parentPartId, parentPart.id))
		.where(opts.where)
		.orderBy(desc(logs.createdAt))
		.limit(opts.limit ?? 50);
}
