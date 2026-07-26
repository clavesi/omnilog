import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { auth } from "$lib/server/auth";

export const handle: Handle = async ({ event, resolve }) => {
	const authSession = await auth.api.getSession({ headers: event.request.headers });

	if (authSession) {
		event.locals.session = authSession.session;
		event.locals.user = authSession.user;
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
