import { sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { mediaItems, mediaParts } from "./db/schema";

/**
 * A log targets either a whole media item (mediaItemId) or a part (mediaPartId),
 * never both — enforced by a DB check constraint. These aliases let us join
 * both paths in one query and coalesce the resolved media fields.
 */
export const directMedia = alias(mediaItems, "direct_media");
export const partMedia = alias(mediaItems, "part_media");
/** Parent of an episode part — its partNumber is the season number for TV. */
export const parentPart = alias(mediaParts, "parent_part");

export const logMediaSelect = {
	mediaSlug: sql<string>`coalesce(${directMedia.slug}, ${partMedia.slug})`,
	mediaTitle: sql<string>`coalesce(${directMedia.title}, ${partMedia.title})`,
	mediaCoverUrl: sql<string | null>`coalesce(${directMedia.coverImageUrl}, ${partMedia.coverImageUrl})`,
	mediaType: sql<string>`coalesce(${directMedia.mediaType}, ${partMedia.mediaType})`,
	partTitle: mediaParts.title,
	partNumber: mediaParts.partNumber,
	seasonNumber: parentPart.partNumber,
};
