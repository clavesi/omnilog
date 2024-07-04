import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	if (!locals.user) return { username: null };

	return { username: locals.user.username };
};
