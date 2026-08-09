import { error, redirect } from "@sveltejs/kit";
import { inArray } from "drizzle-orm";
import { logs } from "$lib/server/db/schema";
import { queryLogsWithMedia } from "$lib/server/logs";
import { getProfileContext } from "$lib/server/profile";
import { getTagBySlug, getUserLogIdsByTag } from "$lib/server/tags";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const viewerId = locals.user?.id ?? null;
	const ctx = await getProfileContext(params.username, viewerId);

	if (!ctx.canSeeContent) redirect(302, `/u/${ctx.profileUser.username}`);

	const tag = await getTagBySlug(params.tag);
	if (!tag) throw error(404, "Tag not found");

	const logIds = await getUserLogIdsByTag(ctx.profileUser.id, tag.id, ctx.isOwnProfile);

	// Fetch ids first, then hydrate through the shared query so these cards get
	// the same media joins, counts, and tags as every other log listing.
	const taggedLogs = logIds.length > 0 ? await queryLogsWithMedia({ where: inArray(logs.id, logIds), limit: 100 }) : [];

	return {
		profileUser: ctx.profileUser,
		tag,
		logs: taggedLogs,
		isOwnProfile: ctx.isOwnProfile,
		currentUserId: viewerId,
	};
};
