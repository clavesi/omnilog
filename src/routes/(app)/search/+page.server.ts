import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { mediaItems } from "$lib/server/db/schema";
import { importGame } from "$lib/server/igdb";
import { importMovie, importTv } from "$lib/server/tmdb";

export const actions = {
	pickResult: async (event) => {
		// Anonymous visitors can search and browse, but importing writes to
		// the DB — require login before that happens.
		requireUser(event);

		const { request } = event;
		const form = await request.formData();
		const type = form.get("type");
		const externalIdRaw = form.get("externalId");
		const externalId = Number(externalIdRaw);

		if (!Number.isFinite(externalId)) {
			return fail(400, { error: "Bad id" });
		}

		let mediaItemId: string;
		if (type === "movie") {
			mediaItemId = await importMovie(externalId);
		} else if (type === "tv") {
			mediaItemId = await importTv(externalId);
		} else if (type === "game") {
			mediaItemId = await importGame(externalId);
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

		redirect(303, `/media/${item.slug}`);
	},
};
