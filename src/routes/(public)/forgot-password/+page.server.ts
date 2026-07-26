import { fail, redirect } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
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

		await auth.api.requestPasswordReset({
			body: { email, redirectTo: "/reset-password" },
		});

		return { success: true };
	},
};
