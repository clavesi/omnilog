import { fail } from "@sveltejs/kit";
import { requireUser } from "$lib/server/auth";
import { acceptFollowRequest, rejectFollowRequest } from "$lib/server/follows";
import { getNotifications, markNonActionableAsRead } from "$lib/server/notifications";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);

	// Read the list before marking anything, so this visit still shows which
	// rows were new. They'll come back read on the next load.
	const notifications = await getNotifications(user.id);
	await markNonActionableAsRead(user.id);

	return { notifications };
};

export const actions: Actions = {
	acceptRequest: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const followerId = String(form.get("followerId") ?? "");
		if (!followerId) return fail(400, { error: "Missing followerId" });

		await acceptFollowRequest(user.id, followerId);
		return { success: true };
	},

	rejectRequest: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const followerId = String(form.get("followerId") ?? "");
		if (!followerId) return fail(400, { error: "Missing followerId" });

		await rejectFollowRequest(user.id, followerId);
		return { success: true };
	},
};
