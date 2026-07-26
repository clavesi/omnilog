import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import { safeRelativePath } from "$lib/server/safe-path";
import type { Actions, PageServerLoad } from "./$types";

// If already logged in, bounce them to the app.
export const load: PageServerLoad = (event) => {
	const next = safeRelativePath(event.url.searchParams.get("next"));
	if (event.locals.user) {
		redirect(302, next);
	}
	return { next };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get("email");
		const username = formData.get("username");
		const password = formData.get("password");
		const nextRaw = formData.get("next");
		const next = safeRelativePath(typeof nextRaw === "string" ? nextRaw : null);

		// Keep email/username on failure so the form doesn't blank out
		const formValues = {
			email: typeof email === "string" ? email : "",
			username: typeof username === "string" ? username : "",
		};

		if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
			return fail(400, { ...formValues, message: "Invalid email" });
		}
		if (typeof username !== "string" || username.length < 3 || username.length > 31) {
			return fail(400, { ...formValues, message: "Username must be 3-31 characters" });
		}
		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			return fail(400, {
				...formValues,
				message: "Username can only contain letters, numbers, and underscores",
			});
		}
		if (typeof password !== "string" || password.length < 8 || password.length > 255) {
			return fail(400, { ...formValues, message: "Password must be at least 8 characters" });
		}

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					// Better Auth's core "name" field isn't used anywhere in
					// this app's UI — username is the real public handle
					name: username,
					username,
					callbackURL: "/settings?verified=1",
				},
				headers: event.request.headers,
			});
		} catch (err) {
			// Better Auth's own email/username-uniqueness checks (via the username plugin) throw here.
			// Surface a reasonably specific message without relying on parsing its internal error shape.
			const message = err instanceof Error ? err.message : "Could not create account";
			return fail(400, { ...formValues, message });
		}

		redirect(303, next);
	},
};
