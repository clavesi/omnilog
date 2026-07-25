import { fail, redirect } from "@sveltejs/kit";
import { createPasswordResetToken, getUserByEmail } from "$lib/server/password-reset";
import { sendPasswordResetEmail } from "$lib/server/resend";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	if (event.locals.user) redirect(302, "/feed");
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = String(form.get("email") ?? "").trim();

		if (!email?.includes("@")) {
			return fail(400, { email, message: "Enter a valid email" });
		}

		// Always show the same success message regardless of whether the
		// email is actually registered — confirming/denying account
		// existence via this form is an account-enumeration risk.
		const user = await getUserByEmail(email);
		if (user) {
			const rawToken = await createPasswordResetToken(user.id);
			// null means a token was already issued recently (cooldown) —
			// don't send a second email, but still show the same success
			// message so this isn't distinguishable from the first request.
			if (rawToken) {
				const resetUrl = `${event.url.origin}/reset-password?token=${rawToken}`;
				await sendPasswordResetEmail(user.email, resetUrl);
			}
		}

		return { success: true };
	},
};
