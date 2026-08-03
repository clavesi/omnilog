import { error } from "@sveltejs/kit";
import { BROWSE_PAGE_SIZE, getGenreBySlug, getMediaByGenre } from "$lib/server/browse";
import { mediaTypeEnum } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

const VALID_MEDIA_TYPES = new Set<string>(mediaTypeEnum.enumValues);

export const load: PageServerLoad = async ({ params, url }) => {
	const genre = await getGenreBySlug(params.slug);
	if (!genre) throw error(404, "Genre not found");

	const typeParam = url.searchParams.get("type") ?? "";
	const mediaType = VALID_MEDIA_TYPES.has(typeParam) ? typeParam : undefined;
	const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

	const { items, total } = await getMediaByGenre(genre.id, { mediaType, page });
	const totalPages = Math.ceil(total / BROWSE_PAGE_SIZE);

	return { genre, items, total, page, totalPages, mediaType: mediaType ?? null };
};
