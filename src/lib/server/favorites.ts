import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { favorites, mediaItems, type mediaTypeEnum } from "./db/schema";

type MediaType = (typeof mediaTypeEnum.enumValues)[number];

export type ShowcaseItem = {
	mediaType: string;
	mediaItemId: string;
	slug: string;
	title: string;
	coverImageUrl: string | null;
};

/**
 * All of a user's favorites, joined with the media item for display.
 * At most one row per media type, so this is naturally sized to however many types
 * the user has picked, never assume all seven are present.
 */
export async function getShowcaseForUser(userId: string): Promise<ShowcaseItem[]> {
	const rows = await db
		.select({
			mediaType: favorites.mediaType,
			mediaItemId: favorites.mediaItemId,
			slug: mediaItems.slug,
			title: mediaItems.title,
			coverImageUrl: mediaItems.coverImageUrl,
		})
		.from(favorites)
		.innerJoin(mediaItems, eq(favorites.mediaItemId, mediaItems.id))
		.where(eq(favorites.userId, userId));

	return rows;
}

/** The current user's favorite mediaItemId for a single media type, or null. */
export async function getFavoriteForType(userId: string, mediaType: MediaType): Promise<string | null> {
	const [row] = await db
		.select({ mediaItemId: favorites.mediaItemId })
		.from(favorites)
		.where(and(eq(favorites.userId, userId), eq(favorites.mediaType, mediaType)))
		.limit(1);
	return row?.mediaItemId ?? null;
}

/**
 * Set a media item as the user's favorite for its type.
 * Replaces any existing favorite of that type.
 */
export async function setFavorite(userId: string, mediaItemId: string, mediaType: MediaType) {
	await db
		.insert(favorites)
		.values({ userId, mediaItemId, mediaType })
		.onConflictDoUpdate({
			target: [favorites.userId, favorites.mediaType],
			set: { mediaItemId, createdAt: new Date() },
		});
}

export async function removeFavorite(userId: string, mediaType: MediaType) {
	await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.mediaType, mediaType)));
}
