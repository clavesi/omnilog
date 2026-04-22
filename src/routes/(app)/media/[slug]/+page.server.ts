// src/routes/media/[slug]/+page.server.ts
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { mediaItems, mediaMetadata, mediaGenres, genres } from "$lib/server/db/schema";

export const load: PageServerLoad = async ({ params }) => {
	const [item] = await db.select().from(mediaItems).where(eq(mediaItems.slug, params.slug)).limit(1);

	if (!item) throw error(404, "Not found");

	const [meta] = await db.select().from(mediaMetadata).where(eq(mediaMetadata.mediaItemId, item.id)).limit(1);

	const itemGenres = await db
		.select({ name: genres.name, slug: genres.slug })
		.from(mediaGenres)
		.innerJoin(genres, eq(mediaGenres.genreId, genres.id))
		.where(eq(mediaGenres.mediaItemId, item.id));

	return {
		item,
		metadata: meta?.metadata ?? null,
		genres: itemGenres,
	};
};
