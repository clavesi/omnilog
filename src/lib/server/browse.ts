import { and, asc, count, desc, eq, gte, lt, type SQL, sql } from "drizzle-orm";
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
export const BROWSE_PAGE_SIZE = PAGE_SIZE;

/** The 8 columns fetched for every browse result row. */
const browseItemColumns = {
	id: mediaItems.id,
	slug: mediaItems.slug,
	title: mediaItems.title,
	mediaType: mediaItems.mediaType,
	releaseDate: mediaItems.releaseDate,
	coverImageUrl: mediaItems.coverImageUrl,
	averageRating: mediaItems.averageRating,
	ratingCount: mediaItems.ratingCount,
};

/**
 * Shared paginator for getMediaByGenre / getMediaByDecade. The two callers
 * differ only in their from-clause (mediaGenres join vs mediaItems directly)
 * and their base conditions, so those are passed in.
 */
async function paginateBrowse(query: {
	from: typeof mediaItems | typeof mediaGenres;
	conditions: SQL[];
	page: number;
}): Promise<{ items: BrowseItem[]; total: number }> {
	const offset = (query.page - 1) * PAGE_SIZE;
	const where = and(...query.conditions);

	// Genre queries need to join through mediaGenres; decade queries hit mediaItems directly.
	const isGenre = query.from === mediaGenres;

	const [totalRow] = isGenre
		? await db
				.select({ count: count() })
				.from(mediaGenres)
				.innerJoin(mediaItems, eq(mediaItems.id, mediaGenres.mediaItemId))
				.where(where)
		: await db.select({ count: count() }).from(mediaItems).where(where);

	const items = isGenre
		? await db
				.select(browseItemColumns)
				.from(mediaGenres)
				.innerJoin(mediaItems, eq(mediaItems.id, mediaGenres.mediaItemId))
				.where(where)
				.orderBy(desc(mediaItems.ratingCount), asc(mediaItems.title))
				.limit(PAGE_SIZE)
				.offset(offset)
		: await db
				.select(browseItemColumns)
				.from(mediaItems)
				.where(where)
				.orderBy(desc(mediaItems.ratingCount), asc(mediaItems.title))
				.limit(PAGE_SIZE)
				.offset(offset);

	return { items, total: totalRow?.count ?? 0 };
}

/** All genres with their media item count, sorted alphabetically. */
export async function getAllGenresWithCounts(): Promise<GenreWithCount[]> {
	return db
		.select({ id: genres.id, name: genres.name, slug: genres.slug, count: count(mediaGenres.mediaItemId) })
		.from(genres)
		.innerJoin(mediaGenres, eq(mediaGenres.genreId, genres.id))
		.groupBy(genres.id, genres.name, genres.slug)
		.orderBy(asc(genres.name));
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
	const conditions: SQL[] = [eq(mediaGenres.genreId, genreId)];
	if (opts.mediaType) conditions.push(eq(mediaItems.mediaType, opts.mediaType as never));
	return paginateBrowse({ from: mediaGenres, conditions, page: opts.page ?? 1 });
}

/** Media items for a decade, optionally filtered by media type, paginated. */
export async function getMediaByDecade(
	decadeStart: number,
	opts: { mediaType?: string; page?: number } = {},
): Promise<{ items: BrowseItem[]; total: number }> {
	const conditions: SQL[] = [
		gte(mediaItems.releaseDate, `${decadeStart}-01-01`),
		lt(mediaItems.releaseDate, `${decadeStart + 10}-01-01`),
	];
	if (opts.mediaType) conditions.push(eq(mediaItems.mediaType, opts.mediaType as never));
	return paginateBrowse({ from: mediaItems, conditions, page: opts.page ?? 1 });
}

/** Distinct decades that have media, sorted descending. */
export async function getDecadesWithCounts(): Promise<{ decade: number; count: number }[]> {
	return db
		.select({
			decade: sql<number>`(floor(extract(year from ${mediaItems.releaseDate}::date) / 10) * 10)::int`.as("decade"),
			count: count(),
		})
		.from(mediaItems)
		.where(sql`${mediaItems.releaseDate} is not null`)
		.groupBy(sql`decade`)
		.orderBy(desc(sql`decade`));
}
