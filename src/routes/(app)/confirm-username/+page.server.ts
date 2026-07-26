import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { auth, requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	const user = requireUser(event);
	// Already confirmed — nothing to do here, send them into the app.
	if (user.usernameConfirmed) redirect(302, "/feed");
	return { suggestedUsername: user.username };
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const chosen = String(form.get("username") ?? "").trim();

		if (chosen.length < 3 || chosen.length > 30) {
			return fail(400, { message: "Username must be 3-30 characters" });
		}
		if (!/^[a-zA-Z0-9_]+$/.test(chosen)) {
			return fail(400, { message: "Username can only contain letters, numbers, and underscores" });
		}

		try {
			await auth.api.updateUser({
				body: { username: chosen },
				headers: event.request.headers,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "That username isn't available";
			return fail(400, { message });
		}

		await db.update(users).set({ usernameConfirmed: true, updatedAt: new Date() }).where(eq(users.id, user.id));

		redirect(303, "/feed");
	},
};
