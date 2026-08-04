import { type ActionFailure, error, fail } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { logs, mediaExternalIds, mediaItems, mediaParts } from "./db/schema";

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

/**
 * Returns a Map<partId, logId> for whichever of the given part ids the user
 * has already logged. Used by episodes/season/tracks loaders to show an
 * "Edit log" link instead of "Log" for already-logged parts.
 *
 * Returns an empty map when userId is null (unauthenticated) or partIds is empty.
 */
export async function getUserLogIdsForParts(userId: string | null, partIds: string[]): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	if (!userId || partIds.length === 0) return map;

	const rows = await db
		.select({ id: logs.id, mediaPartId: logs.mediaPartId })
		.from(logs)
		.where(and(eq(logs.userId, userId), inArray(logs.mediaPartId, partIds)));

	for (const row of rows) {
		if (row.mediaPartId) map.set(row.mediaPartId, row.id);
	}
	return map;
}

type SubMediaItem = { id: string; slug: string; title: string; mediaType: string };

/**
 * Load a media item by slug, asserting it matches the expected media type.
 * Used by episodes, season, tracks, and chapters loaders which all start with
 * the same two-step lookup → type-guard sequence.
 */
export async function requireItemBySlugOfType(slug: string, expectedType: string): Promise<SubMediaItem> {
	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== expectedType) throw error(400, `Not a ${expectedType}`);
	return item;
}

/**
 * Fetch the external id string for a media item from a specific source,
 * throwing 500 if it's missing. Used by season and tracks loaders which both
 * need to look up a source-specific id before calling an import function.
 */
export async function requireExternalId(
	mediaItemId: string,
	source: "tmdb" | "musicbrainz" | "igdb",
	label: string,
): Promise<string> {
	const [ext] = await db
		.select({ externalId: mediaExternalIds.externalId })
		.from(mediaExternalIds)
		.where(and(eq(mediaExternalIds.mediaItemId, mediaItemId), eq(mediaExternalIds.source, source)))
		.limit(1);

	if (!ext) throw error(500, `No ${label} external id found`);
	return ext.externalId;
}
