import { redirect } from "@sveltejs/kit";
import { isMediaStatus, type MediaStatus } from "$lib/media-status";
import { getStatusCounts, getStatusList } from "$lib/server/media-status";
import { getProfileContext } from "$lib/server/profile";
import type { PageServerLoad } from "./$types";

const DEFAULT_STATUS: MediaStatus = "in_progress";

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const ctx = await getProfileContext(params.username, locals.user?.id ?? null);

	// Same rule as tags and followers — a private account's activity isn't
	// browsable by non-followers.
	if (!ctx.canSeeContent) redirect(302, `/u/${ctx.profileUser.username}`);

	const requested = url.searchParams.get("status") ?? "";
	const status: MediaStatus = isMediaStatus(requested) ? requested : DEFAULT_STATUS;

	const [entries, counts] = await Promise.all([
		getStatusList(ctx.profileUser.id, status),
		getStatusCounts(ctx.profileUser.id),
	]);

	return { profileUser: ctx.profileUser, status, entries, counts };
};
