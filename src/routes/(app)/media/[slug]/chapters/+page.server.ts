import { requireItemBySlugOfType } from "$lib/server/log-routes";
import type { PageServerLoad } from "./$types";

// Chapter-level tracking for manga is intentionally not supported
// until a good source can be found for just chapters.
export const load: PageServerLoad = async ({ params }) => {
	const item = await requireItemBySlugOfType(params.slug, "manga");
	return { item };
};
