import { type ActionFailure, error, fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaItems, mediaParts } from "./db/schema";

type ItemRow = {
	id: string;
	slug: string;
	title: string;
	coverImageUrl: string | null;
	mediaType: string;
	releaseDate?: string | null;
};

/** Load item by slug or 404 — for page loaders. */
export async function requireItemBySlug(slug: string): Promise<ItemRow> {
	const [item] = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			coverImageUrl: mediaItems.coverImageUrl,
			mediaType: mediaItems.mediaType,
			releaseDate: mediaItems.releaseDate,
		})
		.from(mediaItems)
		.where(eq(mediaItems.slug, slug))
		.limit(1);

	if (!item) throw error(404, "Media not found");
	return item;
}

/** Load item + part, verifying the part belongs to the item. */
export async function requirePartForItem(slug: string, partId: string) {
	const item = await requireItemBySlug(slug);

	const [part] = await db
		.select()
		.from(mediaParts)
		.where(and(eq(mediaParts.id, partId), eq(mediaParts.mediaItemId, item.id)))
		.limit(1);

	if (!part) throw error(404, "Part not found");
	return { item, part };
}

/** Same as requirePartForItem but returns form failures for actions. */
export async function requirePartForItemAction(
	slug: string,
	partId: string,
): Promise<{ item: { id: string }; part: typeof mediaParts.$inferSelect } | ActionFailure<{ error: string }>> {
	const [item] = await db.select({ id: mediaItems.id }).from(mediaItems).where(eq(mediaItems.slug, slug)).limit(1);

	if (!item) return fail(404, { error: "Media not found" });

	const [part] = await db
		.select()
		.from(mediaParts)
		.where(and(eq(mediaParts.id, partId), eq(mediaParts.mediaItemId, item.id)))
		.limit(1);

	if (!part) return fail(404, { error: "Part not found" });
	return { item, part };
}

/** Ensure a log belongs to the item in the URL — hides existence from other contexts. */
export function requireLogForItem(log: { mediaItemId: string | null; userId: string }, itemId: string, userId: string) {
	if (log.mediaItemId !== itemId) throw error(404, "Log not found");
	if (log.userId !== userId) throw error(403, "Not your log");
}

/** Same check for part-scoped log edit routes. */
export function requireLogForPart(log: { mediaPartId: string | null; userId: string }, partId: string, userId: string) {
	if (log.mediaPartId !== partId) throw error(404, "Log not found");
	if (log.userId !== userId) throw error(403, "Not your log");
}

export async function requireOwnedLogForItemAction(logId: string, itemId: string, userId: string) {
	const [existingLog] = await db
		.select({ id: logs.id, userId: logs.userId, mediaItemId: logs.mediaItemId })
		.from(logs)
		.where(eq(logs.id, logId))
		.limit(1);

	if (!existingLog || existingLog.mediaItemId !== itemId) return fail(404, { error: "Log not found" });
	if (existingLog.userId !== userId) return fail(403, { error: "Not your log" });
	return existingLog;
}

export async function requireOwnedLogForPartAction(logId: string, partId: string, userId: string) {
	const [existingLog] = await db
		.select({ id: logs.id, userId: logs.userId, mediaPartId: logs.mediaPartId })
		.from(logs)
		.where(eq(logs.id, logId))
		.limit(1);

	if (!existingLog || existingLog.mediaPartId !== partId) return fail(404, { error: "Log not found" });
	if (existingLog.userId !== userId) return fail(403, { error: "Not your log" });
	return existingLog;
}
