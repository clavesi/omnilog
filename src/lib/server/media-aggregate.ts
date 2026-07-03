import { eq } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaItems } from "./db/schema";

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
