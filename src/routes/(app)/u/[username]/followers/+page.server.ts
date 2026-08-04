import { redirect } from "@sveltejs/kit";
import { getFollowers } from "$lib/server/follows";
import { getProfileContext } from "$lib/server/profile";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const ctx = await getProfileContext(params.username, locals.user?.id ?? null);

	// The follower graph is profile content — private accounts don't expose it.
	// Send them back to the profile, which explains the situation properly.
	if (!ctx.canSeeContent) redirect(302, `/u/${ctx.profileUser.username}`);

	const followers = await getFollowers(ctx.profileUser.id);

	return { profileUser: ctx.profileUser, followers };
};
