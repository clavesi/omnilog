import { redirect } from "@sveltejs/kit";
import { getUnreadCount } from "$lib/server/notifications";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
	// OAuth sign ups need to create a username first.
	if (
		event.locals.user &&
		!event.locals.user.usernameConfirmed &&
		!event.url.pathname.startsWith("/confirm-username")
	) {
		redirect(302, "/confirm-username");
	}

	// The notifications page marks rows read during its own load, which races this one.
	// It invalidates this key afterwards so the badge catches up.
	event.depends("app:notifications");

	const unreadNotificationCount = event.locals.user ? await getUnreadCount(event.locals.user.id) : 0;

	return { user: event.locals.user, unreadNotificationCount };
};
