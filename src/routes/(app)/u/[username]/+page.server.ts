import { error, fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, users } from "$lib/server/db/schema";
import { getShowcaseForUser } from "$lib/server/favorites";
import { follow, getFollowCounts, getFollowers, getFollowing, getFollowStatus, unfollow } from "$lib/server/follows";
import { getListsForUser } from "$lib/server/lists";
import { queryLogsWithMedia } from "$lib/server/logs";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [profileUser] = await db
		.select({
			id: users.id,
			username: users.username,
			imageURL: users.image,
			bio: users.bio,
			isPrivate: users.isPrivate,
		})
		.from(users)
		.where(eq(users.username, params.username))
		.limit(1);

	if (!profileUser) throw error(404, "User not found");

	const viewerId = locals.user?.id ?? null;
	const isOwnProfile = viewerId === profileUser.id;

	const [followCounts, followStatus] = await Promise.all([
		getFollowCounts(profileUser.id),
		viewerId && !isOwnProfile ? getFollowStatus(viewerId, profileUser.id) : Promise.resolve(null),
	]);

	// Private accounts: non-followers only see the profile header, not logs or social graph
	const canSeeLogs = isOwnProfile || !profileUser.isPrivate || followStatus === "accepted";

	const [rows, showcase, lists, followers, following] = canSeeLogs
		? await Promise.all([
				queryLogsWithMedia({
					where: isOwnProfile
						? eq(logs.userId, profileUser.id)
						: and(eq(logs.userId, profileUser.id), eq(logs.isPublic, true)),
					limit: 50,
				}),
				getShowcaseForUser(profileUser.id),
				getListsForUser(profileUser.id, isOwnProfile),
				getFollowers(profileUser.id),
				getFollowing(profileUser.id),
			])
		: [[], [], [], [], []];

	return {
		profileUser,
		logs: rows,
		showcase,
		lists,
		isOwnProfile,
		canSeeLogs,
		followStatus,
		followCounts,
		followers,
		following,
	};
};

export const actions: Actions = {
	follow: async (event) => {
		const viewer = requireUser(event);
		const { params } = event;

		const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, params.username)).limit(1);
		if (!target) return fail(404, { error: "User not found" });
		if (target.id === viewer.id) return fail(400, { error: "Cannot follow yourself" });

		const status = await follow(viewer.id, target.id);
		return { followStatus: status };
	},

	unfollow: async (event) => {
		const viewer = requireUser(event);
		const { params } = event;

		const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, params.username)).limit(1);
		if (!target) return fail(404, { error: "User not found" });

		await unfollow(viewer.id, target.id);
		return { followStatus: "not_following" as const };
	},
};
