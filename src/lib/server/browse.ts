import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { genres, mediaGenres, mediaItems } from "./db/schema";

export type BrowseItem = {
	id: string;
	slug: string;
	title: string;
	mediaType: string;
	releaseDate: string | null;
	coverImageUrl: string | null;
	averageRating: string | null;
	ratingCount: number;
};

export type GenreWithCount = {
	id: string;
	name: string;
	slug: string;
	count: number;
};

const PAGE_SIZE = 36;

/** All genres with their media item count, sorted alphabetically. */
export async function getAllGenresWithCounts(): Promise<GenreWithCount[]> {
	const rows = await db
		.select({
			id: genres.id,
			name: genres.name,
			slug: genres.slug,
			count: count(mediaGenres.mediaItemId),
		})
		.from(genres)
		.innerJoin(mediaGenres, eq(mediaGenres.genreId, genres.id))
		.groupBy(genres.id, genres.name, genres.slug)
		.orderBy(asc(genres.name));

	return rows;
}

/** Genre by slug. */
export async function getGenreBySlug(slug: string) {
	const [row] = await db.select().from(genres).where(eq(genres.slug, slug)).limit(1);
	return row ?? null;
}

/** Media items for a genre, optionally filtered by media type, paginated. */
export async function getMediaByGenre(
	genreId: string,
	opts: { mediaType?: string; page?: number } = {},
): Promise<{ items: BrowseItem[]; total: number }> {
	const page = opts.page ?? 1;
	const offset = (page - 1) * PAGE_SIZE;

	const conditions = [eq(mediaGenres.genreId, genreId)];
	if (opts.mediaType) {
		conditions.push(eq(mediaItems.mediaType, opts.mediaType as never));
	}

	const [totalRow] = await db
		.select({ count: count() })
		.from(mediaGenres)
		.innerJoin(mediaItems, eq(mediaItems.id, mediaGenres.mediaItemId))
		.where(and(...conditions));

	const items = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			mediaType: mediaItems.mediaType,
			releaseDate: mediaItems.releaseDate,
			coverImageUrl: mediaItems.coverImageUrl,
			averageRating: mediaItems.averageRating,
			ratingCount: mediaItems.ratingCount,
		})
		.from(mediaGenres)
		.innerJoin(mediaItems, eq(mediaItems.id, mediaGenres.mediaItemId))
		.where(and(...conditions))
		.orderBy(desc(mediaItems.ratingCount), asc(mediaItems.title))
		.limit(PAGE_SIZE)
		.offset(offset);

	return { items, total: totalRow?.count ?? 0 };
}

/** Media items for a decade, optionally filtered by media type, paginated. */
export async function getMediaByDecade(
	decadeStart: number,
	opts: { mediaType?: string; page?: number } = {},
): Promise<{ items: BrowseItem[]; total: number }> {
	const page = opts.page ?? 1;
	const offset = (page - 1) * PAGE_SIZE;
	const startDate = `${decadeStart}-01-01`;
	const endDate = `${decadeStart + 10}-01-01`;

	const conditions = [gte(mediaItems.releaseDate, startDate), lt(mediaItems.releaseDate, endDate)];
	if (opts.mediaType) {
		conditions.push(eq(mediaItems.mediaType, opts.mediaType as never));
	}

	const [totalRow] = await db
		.select({ count: count() })
		.from(mediaItems)
		.where(and(...conditions));

	const items = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			mediaType: mediaItems.mediaType,
			releaseDate: mediaItems.releaseDate,
			coverImageUrl: mediaItems.coverImageUrl,
			averageRating: mediaItems.averageRating,
			ratingCount: mediaItems.ratingCount,
		})
		.from(mediaItems)
		.where(and(...conditions))
		.orderBy(desc(mediaItems.ratingCount), asc(mediaItems.title))
		.limit(PAGE_SIZE)
		.offset(offset);

	return { items, total: totalRow?.count ?? 0 };
}

/** Distinct decades that have media, sorted descending. */
export async function getDecadesWithCounts(): Promise<{ decade: number; count: number }[]> {
	const rows = await db
		.select({
			decade: sql<number>`(floor(extract(year from ${mediaItems.releaseDate}::date) / 10) * 10)::int`.as("decade"),
			count: count(),
		})
		.from(mediaItems)
		.where(sql`${mediaItems.releaseDate} is not null`)
		.groupBy(sql`decade`)
		.orderBy(desc(sql`decade`));

	return rows;
}

export const BROWSE_PAGE_SIZE = PAGE_SIZE;
