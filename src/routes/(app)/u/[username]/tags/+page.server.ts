import { redirect } from "@sveltejs/kit";
import { getProfileContext } from "$lib/server/profile";
import { getUserTags } from "$lib/server/tags";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const viewerId = locals.user?.id ?? null;
	const ctx = await getProfileContext(params.username, viewerId);

	// Same rule as followers/following — a private account's activity isn't
	// browsable, and tags describe activity.
	if (!ctx.canSeeContent) redirect(302, `/u/${ctx.profileUser.username}`);

	const tags = await getUserTags(ctx.profileUser.id, ctx.isOwnProfile);

	return { profileUser: ctx.profileUser, tags };
};
