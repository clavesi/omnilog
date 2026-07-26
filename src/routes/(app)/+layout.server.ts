import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = (event) => {
	// OAuth sign ups need to create a username first.
	if (
		event.locals.user &&
		!event.locals.user.usernameConfirmed &&
		!event.url.pathname.startsWith("/confirm-username")
	) {
		redirect(302, "/confirm-username");
	}

	return { user: event.locals.user };
};
