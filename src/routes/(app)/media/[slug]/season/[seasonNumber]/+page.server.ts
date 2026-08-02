import { error } from "@sveltejs/kit";
import { getUserLogIdsForParts, requireExternalId, requireItemBySlugOfType } from "$lib/server/log-routes";
import { importSeasonEpisodes } from "$lib/server/tmdb";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const seasonNumber = Number(params.seasonNumber);
	if (!Number.isFinite(seasonNumber)) throw error(400, "Bad season number");

	const item = await requireItemBySlugOfType(params.slug, "tv");
	const rawId = await requireExternalId(item.id, "tmdb", "TMDB");
	const tmdbShowId = Number(rawId.replace("tv:", ""));

	const episodes = await importSeasonEpisodes(item.id, tmdbShowId, seasonNumber);
	const loggedPartLogIds = await getUserLogIdsForParts(
		locals.user?.id ?? null,
		episodes.map((e) => e.id),
	);

	return {
		item,
		seasonNumber,
		episodes: episodes.map((e) => ({
			id: e.id,
			number: e.partNumber,
			title: e.title,
			releaseDate: e.releaseDate,
			averageRating: e.averageRating,
			ratingCount: e.ratingCount,
			existingLogId: loggedPartLogIds.get(e.id) ?? null,
		})),
	};
};
