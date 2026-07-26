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
		const email = formData.get("email");
		const password = formData.get("password");
		const nextRaw = formData.get("next");
		const next = safeRelativePath(typeof nextRaw === "string" ? nextRaw : null);

		const formValues = { email: typeof email === "string" ? email : "" };

		if (typeof email !== "string" || typeof password !== "string") {
			return fail(400, { ...formValues, message: "Email and password are required" });
		}

		try {
			await auth.api.signInEmail({ body: { email, password }, headers: event.request.headers });
		} catch {
			// Generic message regardless of whether the email exists or the password was wrong
			return fail(400, { ...formValues, message: "Incorrect email or password" });
		}

		redirect(303, next);
	},
};
