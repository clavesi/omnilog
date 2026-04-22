// src/routes/search/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mediaItems } from "$lib/server/db/schema";
import { importMovie, importTv } from "$lib/server/tmdb";

export const actions = {
	pickResult: async ({ request }) => {
		const form = await request.formData();
		const type = form.get("type");
		const tmdbIdRaw = form.get("tmdbId");
		const tmdbId = Number(tmdbIdRaw);

		if (!Number.isFinite(tmdbId)) {
			return fail(400, { error: "Bad tmdbId" });
		}

		let mediaItemId: string;
		if (type === "movie") {
			mediaItemId = await importMovie(tmdbId);
		} else if (type === "tv") {
			mediaItemId = await importTv(tmdbId);
		} else {
			return fail(400, { error: "Unknown type" });
		}

		const [item] = await db
			.select({ slug: mediaItems.slug })
			.from(mediaItems)
			.where(eq(mediaItems.id, mediaItemId))
			.limit(1);

		if (!item) {
			return fail(500, { error: "Import succeeded but lookup failed" });
		}

		throw redirect(303, `/media/${item.slug}`);
	},
};
