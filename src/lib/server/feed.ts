import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaItems, users } from "./db/schema";

const PAGE_SIZE = 20;

export type FeedCursor = { createdAt: string; id: string };

export function encodeCursor(c: FeedCursor): string {
	return `${c.createdAt}_${c.id}`;
}

function decodeCursor(raw: string | null): FeedCursor | null {
	if (!raw) return null;
	const idx = raw.lastIndexOf("_");
	if (idx === -1) return null;
	return { createdAt: raw.slice(0, idx), id: raw.slice(idx + 1) };
}

/**
 * Global public feed, newest first. Keyset (cursor) pagination — more
 * robust than offset/page-number once logs are being inserted concurrently,
 * since it won't skip or duplicate rows as new logs come in between pages.
 *
 * excludeUserId: pass to hide a user's own logs from a "not mine" view.
 * Currently unused (feed shows everyone including you) but wired up in
 * case you want that toggle later.
 */
export async function getFeedPage(opts: { cursorRaw?: string | null; excludeUserId?: string } = {}) {
	const cursor = decodeCursor(opts.cursorRaw ?? null);

	const conditions = [eq(logs.isPublic, true)];

	if (cursor) {
		// createdAt < cursor.createdAt, OR (createdAt = cursor.createdAt AND id < cursor.id)
		// The id tiebreaker matters because createdAt alone isn't guaranteed unique.
		const cursorCondition = or(
			lt(logs.createdAt, new Date(cursor.createdAt)),
			and(eq(logs.createdAt, new Date(cursor.createdAt)), lt(logs.id, cursor.id)),
		);
		if (cursorCondition) {
			conditions.push(cursorCondition);
		}
	}

	if (opts.excludeUserId) {
		conditions.push(eq(logs.userId, opts.excludeUserId));
	}

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
			mediaPartId: logs.mediaPartId,
			loggedAt: logs.loggedAt,
			createdAt: logs.createdAt,
			username: users.username,
			mediaSlug: mediaItems.slug,
			mediaTitle: mediaItems.title,
			mediaCoverUrl: mediaItems.coverImageUrl,
			mediaType: mediaItems.mediaType,
		})
		.from(logs)
		.innerJoin(users, eq(logs.userId, users.id))
		.innerJoin(mediaItems, eq(logs.mediaItemId, mediaItems.id))
		.where(and(...conditions))
		.orderBy(desc(logs.createdAt), desc(logs.id))
		.limit(PAGE_SIZE + 1); // fetch one extra to know if there's a next page

	const hasMore = rows.length > PAGE_SIZE;
	const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

	const last = page[page.length - 1];
	const nextCursor = hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null;

	return { logs: page, nextCursor };
}
