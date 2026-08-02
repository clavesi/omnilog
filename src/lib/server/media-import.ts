import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { type externalSourceEnum, genres, mediaExternalIds, mediaGenres } from "$lib/server/db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * The subset of external_source values this app actually imports from.
 * Written as an Extract of the DB enum rather than a standalone union so that
 * dropping a value from the enum fails to compile here instead of drifting silently.
 */
type MediaExternalSource = Extract<
	(typeof externalSourceEnum.enumValues)[number],
	"tmdb" | "igdb" | "mal" | "musicbrainz" | "openlibrary"
>;

function slugify(s: string): string {
	return s
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function buildSlug(
	title: string,
	dateOrYear: string | number | null | undefined,
	mediaType: string,
	externalId: string | number,
): string {
	const year = dateOrYear ? String(dateOrYear).slice(0, 4) : "unknown";
	return `${slugify(title)}-${year}-${mediaType}-${externalId}`;
}

export async function findExistingMediaId(source: MediaExternalSource, externalId: string): Promise<string | null> {
	const rows = await db
		.select({ mediaItemId: mediaExternalIds.mediaItemId })
		.from(mediaExternalIds)
		.where(and(eq(mediaExternalIds.source, source), eq(mediaExternalIds.externalId, externalId)))
		.limit(1);
	return rows[0]?.mediaItemId ?? null;
}

export async function linkGenres(tx: DbTransaction, mediaItemId: string, genreList: { name: string }[]) {
	for (const g of genreList) {
		const slug = slugify(g.name);
		const [genre] = await tx
			.insert(genres)
			.values({ name: g.name, slug })
			.onConflictDoUpdate({ target: genres.slug, set: { name: g.name } })
			.returning({ id: genres.id });

		await tx.insert(mediaGenres).values({ mediaItemId, genreId: genre.id }).onConflictDoNothing();
	}
}
