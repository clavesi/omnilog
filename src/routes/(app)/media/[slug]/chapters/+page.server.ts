import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mediaItems } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

// Chapter-level tracking for manga is intentionally not supported
// until a good source can be found for just chapters.
export const load: PageServerLoad = async ({ params }) => {
	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== "manga") throw error(400, "Not a manga");

	return { item };
};
