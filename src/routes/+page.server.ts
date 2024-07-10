import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	if (!locals.user) {
		return { username: null };

		// Use to protect routes
		// redirect(302, "/login");
	}

	return {
		username: locals?.user?.username
	};
};
