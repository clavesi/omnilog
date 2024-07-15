import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	if (!locals.user) redirect(302, "/auth/login");

	return {
		displayName: locals.user.displayName,
		username: locals.user.username,
		email: locals.user.email,
		imageUrl: locals.user.imageUrl
	};
};
