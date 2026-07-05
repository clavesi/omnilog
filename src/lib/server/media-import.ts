import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { genres, mediaExternalIds, mediaGenres } from "$lib/server/db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type MediaExternalSource = "tmdb" | "igdb" | "mal" | "musicbrainz" | "openlibrary";

export function slugify(s: string): string {
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
