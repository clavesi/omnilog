import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	// A missing token just means someone landed here without a real reset
	// link — the page itself shows an "invalid link" state for that,
	// consistent with how an expired/already-used token is only discovered
	// at submission time (see the action below).
	return { token: event.url.searchParams.get("token") };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const token = String(form.get("token") ?? "");
		const newPassword = String(form.get("newPassword") ?? "");
		const confirmPassword = String(form.get("confirmPassword") ?? "");

		if (!token) return fail(400, { message: "Missing reset token" });
		if (newPassword.length < 8 || newPassword.length > 255) {
			return fail(400, { message: "Password must be at least 8 characters" });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: "Passwords don't match" });
		}

		try {
			await auth.api.resetPassword({ body: { newPassword, token } });
		} catch {
			return fail(400, { message: "This reset link is invalid or has expired — request a new one." });
		}

		// Force re-login
		redirect(303, "/login?reset=success");
	},
};
