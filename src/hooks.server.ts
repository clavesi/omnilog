import {
    deleteSessionTokenCookie,
    sessionCookieName,
    validateSessionToken,
} from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get(sessionCookieName);

    if (!token) {
        event.locals.user = null;
        event.locals.session = null;
        return resolve(event);
    }

    const { session, user } = await validateSessionToken(token);

    if (!session) {
        deleteSessionTokenCookie(event);
    }

    event.locals.user = user;
    event.locals.session = session;

    return resolve(event);
};
