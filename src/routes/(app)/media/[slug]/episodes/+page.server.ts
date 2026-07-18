import { error } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs, mediaItems } from "$lib/server/db/schema";
import { importAnimeEpisodes } from "$lib/server/jikan";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== "anime") throw error(400, "Not an anime");

	const episodes = await importAnimeEpisodes(item.id);

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
		episodes: episodes.map((e) => ({
			id: e.id,
			number: e.partNumber,
			title: e.title,
			releaseDate: e.releaseDate,
			isFiller: (e.metadata as { filler?: boolean })?.filler ?? false,
			averageRating: e.averageRating,
			ratingCount: e.ratingCount,
			existingLogId: loggedPartLogIds.get(e.id) ?? null,
		})),
	};
};
