import { error } from "@sveltejs/kit";
import { BROWSE_PAGE_SIZE, getMediaByDecade } from "$lib/server/browse";
import { mediaTypeEnum } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

const VALID_MEDIA_TYPES = new Set<string>(mediaTypeEnum.enumValues);

export const load: PageServerLoad = async ({ params, url }) => {
	// Expect "1990s", "2000s", etc.
	const match = params.decade.match(/^(\d{4})s$/);
	if (!match) throw error(404, "Invalid decade");

	const decadeStart = Number(match[1]);
	if (decadeStart % 10 !== 0) throw error(404, "Invalid decade");

	const typeParam = url.searchParams.get("type") ?? "";
	const mediaType = VALID_MEDIA_TYPES.has(typeParam) ? typeParam : undefined;
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

	const { items, total } = await getMediaByDecade(decadeStart, { mediaType, page });
	const totalPages = Math.ceil(total / BROWSE_PAGE_SIZE);

	return { decadeLabel: params.decade, decadeStart, items, total, page, totalPages, mediaType: mediaType ?? null };
};
