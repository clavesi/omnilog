import { eq } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaItems, mediaParts } from "./db/schema";

/**
 * Recalculates averageRating / ratingCount from all logs for a given target.
 * avg is stored with one decimal place (e.g. 7.5) rather than rounded to a
 * whole number so that the displayed star value is accurate.
 */
async function recompute(rated: { rating: number | null }[]) {
	const values = rated.map((r) => r.rating).filter((r): r is number => r !== null);
	const count = values.length;
	const avg = count > 0 ? (values.reduce((a, b) => a + b, 0) / count).toFixed(1) : null;
	return { avg, count };
}

/**
 * Recalculates media_items.averageRating / ratingCount from all logs for that item.
 * Call after any log insert/update/delete that touches the rating field.
 */
export async function recomputeAggregate(mediaItemId: string) {
	const rated = await db.select({ rating: logs.rating }).from(logs).where(eq(logs.mediaItemId, mediaItemId));
	const { avg, count } = await recompute(rated);
	await db
		.update(mediaItems)
		.set({ averageRating: avg, ratingCount: count, updatedAt: new Date() })
		.where(eq(mediaItems.id, mediaItemId));
}

/**
 * Same as recomputeAggregate(), but for an individual media_part
 * (episode, chapter, track). Call after any log insert/update/delete that
 * targets a part rather than a top-level media_item.
 */
export async function recomputePartAggregate(partId: string) {
	const rated = await db.select({ rating: logs.rating }).from(logs).where(eq(logs.mediaPartId, partId));
	const { avg, count } = await recompute(rated);
	await db
		.update(mediaParts)
		.set({ averageRating: avg, ratingCount: count, updatedAt: new Date() })
		.where(eq(mediaParts.id, partId));
}
