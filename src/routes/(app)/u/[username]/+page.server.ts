import { fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, users } from "$lib/server/db/schema";
import { getShowcaseForUser } from "$lib/server/favorites";
import { follow, unfollow } from "$lib/server/follows";
import { getListsForUser } from "$lib/server/lists";
import { queryLogsWithMedia } from "$lib/server/logs";
import { getProfileContext } from "$lib/server/profile";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const { profileUser, isOwnProfile, followStatus, followCounts, canSeeContent } = await getProfileContext(
		params.username,
		locals.user?.id ?? null,
	);

	const [rows, showcase, lists] = canSeeContent
		? await Promise.all([
				queryLogsWithMedia({
					where: isOwnProfile
						? eq(logs.userId, profileUser.id)
						: and(eq(logs.userId, profileUser.id), eq(logs.isPublic, true)),
					limit: 50,
				}),
				getShowcaseForUser(profileUser.id),
				getListsForUser(profileUser.id, isOwnProfile),
			])
		: [[], [], []];

	return {
		profileUser,
		logs: rows,
		showcase,
		lists,
		isOwnProfile,
		canSeeLogs: canSeeContent,
		followStatus,
		followCounts,
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
