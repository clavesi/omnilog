import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import { safeRelativePath } from "$lib/server/safe-path";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	const next = safeRelativePath(event.url.searchParams.get("next"));
	if (event.locals.user) {
		redirect(302, next);
	}
	return { next, resetSuccess: event.url.searchParams.get("reset") === "success" };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get("username");
		const password = formData.get("password");
		const nextRaw = formData.get("next");
		const next = safeRelativePath(typeof nextRaw === "string" ? nextRaw : null);

		const formValues = { username: typeof username === "string" ? username : "" };

		if (typeof username !== "string" || typeof password !== "string") {
			return fail(400, { ...formValues, message: "Username and password are required" });
		}

		try {
			await auth.api.signInUsername({ body: { username, password }, headers: event.request.headers });
		} catch {
			// Generic message regardless of whether the username exists or the password was wrong
			return fail(400, { ...formValues, message: "Incorrect username or password" });
		}

		redirect(303, next);
	},
};
