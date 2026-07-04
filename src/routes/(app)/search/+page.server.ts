import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { mediaItems } from "$lib/server/db/schema";
import { PossibleDuplicateError } from "$lib/server/dedupe";
import { importGame } from "$lib/server/igdb";
import { importAnime, importManga } from "$lib/server/jikan";
import { importMovie, importTv } from "$lib/server/tmdb";

export const actions = {
	pickResult: async (event) => {
		requireUser(event);

		const { request } = event;
		const form = await request.formData();
		const type = form.get("type");
		const externalIdRaw = form.get("externalId");
		const externalId = Number(externalIdRaw);
		const allowDuplicate = form.get("confirmDuplicate") === "true";

		if (!Number.isFinite(externalId)) {
			return fail(400, { error: "Bad id" });
		}

		let mediaItemId: string;
		try {
			if (type === "movie") {
				mediaItemId = await importMovie(externalId, { allowDuplicate });
			} else if (type === "tv") {
				mediaItemId = await importTv(externalId, { allowDuplicate });
			} else if (type === "game") {
				mediaItemId = await importGame(externalId);
			} else if (type === "anime") {
				mediaItemId = await importAnime(externalId, { allowDuplicate });
			} else if (type === "manga") {
				mediaItemId = await importManga(externalId);
			} else {
				return fail(400, { error: "Unknown type" });
			}
		} catch (err) {
			if (err instanceof PossibleDuplicateError) {
				return fail(409, {
					duplicate: {
						slug: err.candidate.slug,
						title: err.candidate.title,
						mediaType: err.candidate.mediaType,
						coverImageUrl: err.candidate.coverImageUrl,
					},
				});
			}
			throw err;
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
