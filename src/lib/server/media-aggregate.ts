import { eq } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaItems, mediaParts } from "./db/schema";

/**
 * Recalculates media_items.averageRating / ratingCount from all logs
 * for that item.
 * Call after any log insert/update/delete that touches the rating field.
 */
export async function recomputeAggregate(mediaItemId: string) {
	const rated = await db.select({ rating: logs.rating }).from(logs).where(eq(logs.mediaItemId, mediaItemId));

	const values = rated.map((r) => r.rating).filter((r): r is number => r !== null);
	const count = values.length;
	const avg = count > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / count) : null;

	await db
		.update(mediaItems)
		.set({
			averageRating: avg?.toString(),
			ratingCount: count,
			updatedAt: new Date(),
		})
		.where(eq(mediaItems.id, mediaItemId));
}

/**
 * Same idea as recomputeAggregate(), but for an individual media_part
 * (episode, chapter, track). Call after any log insert/update/delete that
 * targets a part rather than a top-level media_item.
 */
export async function recomputePartAggregate(partId: string) {
	const rated = await db.select({ rating: logs.rating }).from(logs).where(eq(logs.mediaPartId, partId));

	const values = rated.map((r) => r.rating).filter((r): r is number => r !== null);
	const count = values.length;
	const avg = count > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / count) : null;

	await db
		.update(mediaParts)
		.set({
			averageRating: avg?.toString(),
			ratingCount: count,
			updatedAt: new Date(),
		})
		.where(eq(mediaParts.id, partId));
}
