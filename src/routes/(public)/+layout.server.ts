import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = (event) => {
	if (event.locals.user) {
		const { passwordHash, ...publicUser } = event.locals.user;
		return { user: publicUser };
	}
	return { user: null };
};
