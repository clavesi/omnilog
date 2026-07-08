import { error } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs, mediaExternalIds, mediaItems } from "$lib/server/db/schema";
import { importSeasonEpisodes } from "$lib/server/tmdb";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const seasonNumber = Number(params.seasonNumber);
	if (!Number.isFinite(seasonNumber)) throw error(400, "Bad season number");

	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== "tv") throw error(400, "Not a TV show");

	const [ext] = await db
		.select({ externalId: mediaExternalIds.externalId })
		.from(mediaExternalIds)
		.where(and(eq(mediaExternalIds.mediaItemId, item.id), eq(mediaExternalIds.source, "tmdb")))
		.limit(1);

	if (!ext) throw error(500, "No TMDB external id found for this show");
	const tmdbShowId = Number(ext.externalId.replace("tv:", ""));

	const episodes = await importSeasonEpisodes(item.id, tmdbShowId, seasonNumber);

	// Check which episodes the current user has already logged, so the UI
	// can link straight to "Edit log" for those instead of "Log".
	const loggedPartLogIds = new Map<string, string>();
	if (locals.user && episodes.length > 0) {
		const userLogs = await db
			.select({ id: logs.id, mediaPartId: logs.mediaPartId })
			.from(logs)
			.where(
				and(
					eq(logs.userId, locals.user.id),
					inArray(
						logs.mediaPartId,
						episodes.map((e) => e.id),
					),
				),
			);
		for (const l of userLogs) {
			if (l.mediaPartId) loggedPartLogIds.set(l.mediaPartId, l.id);
		}
	}

	return {
		item,
		seasonNumber,
		episodes: episodes.map((e) => ({
			id: e.id,
			number: e.partNumber,
			title: e.title,
			releaseDate: e.releaseDate,
			existingLogId: loggedPartLogIds.get(e.id) ?? null,
		})),
	};
};
