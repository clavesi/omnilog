import { igdbImage } from "$lib/media-images";
import { importGameAddOns } from "$lib/server/igdb";
import { getUserLogIdsForParts, requireExternalId, requireItemBySlugOfType } from "$lib/server/log-routes";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const item = await requireItemBySlugOfType(params.slug, "game");
	const igdbId = await requireExternalId(item.id, "igdb", "IGDB");
	const addOns = await importGameAddOns(item.id, Number(igdbId));

	const loggedPartLogIds = await getUserLogIdsForParts(
		locals.user?.id ?? null,
		addOns.map((a) => a.id),
	);

	return {
		item,
		addOns: addOns.map((a) => {
			const meta = a.metadata as { coverImageId?: string | null };
			return {
				id: a.id,
				number: a.partNumber,
				title: a.title,
				kind: a.partType === "expansion" ? "Expansion" : "DLC",
				releaseYear: a.releaseDate ? a.releaseDate.slice(0, 4) : null,
				coverUrl: igdbImage(meta?.coverImageId ?? null, "cover_small"),
				averageRating: a.averageRating,
				ratingCount: a.ratingCount,
				existingLogId: loggedPartLogIds.get(a.id) ?? null,
			};
		}),
	};
};
