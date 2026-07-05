import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { mediaItems } from "$lib/server/db/schema";
import { PossibleDuplicateError } from "$lib/server/dedupe";
import { importGame } from "$lib/server/igdb";
import { importAnime, importManga } from "$lib/server/jikan";
import { importAlbum } from "$lib/server/musicbrainz";
import { importBook } from "$lib/server/openlibrary";
import { importMovie, importTv } from "$lib/server/tmdb";

export const actions = {
	pickResult: async (event) => {
		requireUser(event);

		const { request } = event;
		const form = await request.formData();
		const type = form.get("type");
		const externalIdRaw = form.get("externalId");
		const allowDuplicate = form.get("confirmDuplicate") === "true";

		// Numeric-ID sources (TMDB, IGDB, Jikan) vs string-ID sources
		// (MusicBrainz MBIDs, Open Library work keys) need different parsing.
		const numericId = Number(externalIdRaw);
		const stringId = typeof externalIdRaw === "string" ? externalIdRaw : "";

		let mediaItemId: string;
		try {
			if (type === "movie") {
				if (!Number.isFinite(numericId)) return fail(400, { error: "Bad id" });
				mediaItemId = await importMovie(numericId, { allowDuplicate });
			} else if (type === "tv") {
				if (!Number.isFinite(numericId)) return fail(400, { error: "Bad id" });
				mediaItemId = await importTv(numericId, { allowDuplicate });
			} else if (type === "game") {
				if (!Number.isFinite(numericId)) return fail(400, { error: "Bad id" });
				mediaItemId = await importGame(numericId);
			} else if (type === "anime") {
				if (!Number.isFinite(numericId)) return fail(400, { error: "Bad id" });
				mediaItemId = await importAnime(numericId, { allowDuplicate });
			} else if (type === "manga") {
				if (!Number.isFinite(numericId)) return fail(400, { error: "Bad id" });
				mediaItemId = await importManga(numericId);
			} else if (type === "music") {
				if (!stringId) return fail(400, { error: "Bad id" });
				mediaItemId = await importAlbum(stringId);
			} else if (type === "book") {
				if (!stringId) return fail(400, { error: "Bad id" });
				mediaItemId = await importBook(stringId);
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
