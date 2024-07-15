import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	if (!locals.user) return { username: null };

	return {
		displayName: locals.user.displayName,
		username: locals.user.username,
		email: locals.user.email,
		imageUrl: locals.user.imageUrl
	};
};
