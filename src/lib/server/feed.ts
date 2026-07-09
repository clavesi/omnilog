import { and, desc, eq, lt, not, or } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaParts, users } from "./db/schema";
import { directMedia, logMediaSelect, parentPart, partMedia } from "./log-media-joins";
import { logCardSelect } from "./logs";

const PAGE_SIZE = 20;

export type FeedCursor = { createdAt: string; id: string };

export function encodeCursor(c: FeedCursor): string {
	return `${c.createdAt}_${c.id}`;
}

function decodeCursor(raw: string | null): FeedCursor | null {
	if (!raw) return null;
	// ISO timestamps contain hyphens, so split on the last "_" before the log id.
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
 * Currently unused but wired up for later.
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
		conditions.push(not(eq(logs.userId, opts.excludeUserId)));
	}

	const rows = await db
		.select({
			...logCardSelect,
			username: users.username,
			...logMediaSelect,
		})
		.from(logs)
		.innerJoin(users, eq(logs.userId, users.id))
		.leftJoin(directMedia, eq(logs.mediaItemId, directMedia.id))
		.leftJoin(mediaParts, eq(logs.mediaPartId, mediaParts.id))
		.leftJoin(partMedia, eq(mediaParts.mediaItemId, partMedia.id))
		.leftJoin(parentPart, eq(mediaParts.parentPartId, parentPart.id))
		.where(and(...conditions))
		.orderBy(desc(logs.createdAt), desc(logs.id))
		.limit(PAGE_SIZE + 1); // fetch one extra to know if there's a next page

	const hasMore = rows.length > PAGE_SIZE;
	const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

	const last = page[page.length - 1];
	const nextCursor = hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null;

	return { logs: page, nextCursor };
}
