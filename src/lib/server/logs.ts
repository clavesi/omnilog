import { and, count, desc, eq, or, type SQL } from "drizzle-orm";
import type { LogCardData } from "$lib/types/log";
import { getCommentCounts } from "./comments";
import { db } from "./db";
import { logs, mediaParts, users } from "./db/schema";
import { directMedia, logMediaSelect, parentPart, partMedia } from "./log-media-joins";
import { getReactionCounts } from "./reactions";

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
function logVisibilityCondition(currentUserId: string | null): SQL {
	const publicOnly = eq(logs.isPublic, true);
	if (!currentUserId) return publicOnly;
	// or() is typed as possibly-undefined (it returns undefined for an empty arg list),
	// so the fallback is a type guard rather than a real branch.
	return or(publicOnly, eq(logs.userId, currentUserId)) ?? publicOnly;
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

	return attachSocialCounts(attachItemMedia(rows, item));
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

	return attachSocialCounts(attachItemMedia(rows, item, part));
}

/**
 * Logs that may target different media items — uses log-media-joins to resolve
 * slug/title/cover per row. Used for profile (and feed uses the same joins inline
 * because it needs cursor pagination).
 */
/**
 * Attach comment and reaction tallies to a page of logs.
 *
 * Two grouped queries for the whole batch rather than a pair per card. Lives
 * here so every log-listing path picks it up — the feed builds its own query
 * and so can't share queryLogsWithMedia, but both funnel through this.
 */
export async function attachSocialCounts<T extends { id: string }>(
	rows: T[],
): Promise<(T & { commentCount: number; reactionCount: number })[]> {
	const ids = rows.map((r) => r.id);
	const [commentCounts, reactionCounts] = await Promise.all([getCommentCounts(ids), getReactionCounts(ids)]);
	return rows.map((r) => ({
		...r,
		commentCount: commentCounts.get(r.id) ?? 0,
		reactionCount: reactionCounts.get(r.id) ?? 0,
	}));
}

export async function queryLogsWithMedia(opts: { where: SQL | undefined; limit?: number; withUsername?: boolean }) {
	const rows = await db
		.select({
			...logCardSelect,
			...(opts.withUsername ? { username: users.username } : {}),
			...logMediaSelect,
		})
		.from(logs)
		// Inner, not left: logs.userId is NOT NULL with an FK to users, so
		// the row always exists, and a left join would type `username` as
		// nullable for no reason. Joined unconditionally even though it's
		// only selected when asked for — users is 1:1 with logs here so it
		// can't multiply rows, and a conditional join fights Drizzle's
		// builder typing.
		.innerJoin(users, eq(logs.userId, users.id))
		.leftJoin(directMedia, eq(logs.mediaItemId, directMedia.id))
		.leftJoin(mediaParts, eq(logs.mediaPartId, mediaParts.id))
		.leftJoin(partMedia, eq(mediaParts.mediaItemId, partMedia.id))
		.leftJoin(parentPart, eq(mediaParts.parentPartId, parentPart.id))
		.where(opts.where)
		.orderBy(desc(logs.createdAt))
		.limit(opts.limit ?? 50);

	return attachSocialCounts(rows);
}
