import { sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { mediaItems, mediaParts } from "./db/schema";

export const directMedia = alias(mediaItems, "direct_media");
export const partMedia = alias(mediaItems, "part_media");
export const parentPart = alias(mediaParts, "parent_part");

/** Resolved media + part fields for logs targeting either a whole item or a part. */
export const logMediaSelect = {
	mediaSlug: sql<string>`coalesce(${directMedia.slug}, ${partMedia.slug})`,
	mediaTitle: sql<string>`coalesce(${directMedia.title}, ${partMedia.title})`,
	mediaCoverUrl: sql<string | null>`coalesce(${directMedia.coverImageUrl}, ${partMedia.coverImageUrl})`,
	mediaType: sql<string>`coalesce(${directMedia.mediaType}, ${partMedia.mediaType})`,
	partTitle: mediaParts.title,
	partNumber: mediaParts.partNumber,
	seasonNumber: parentPart.partNumber,
};
