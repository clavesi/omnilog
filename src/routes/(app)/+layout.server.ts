import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = (event) => {
	if (!event.locals.user) {
		redirect(302, "/login");
	}

	// Strip the password hash from the user object
	const { passwordHash, ...publicUser } = event.locals.user;
	return { user: publicUser };
};
