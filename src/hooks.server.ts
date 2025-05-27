import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
	const fetchedSession = await auth.api.getSession({
		headers: event.request.headers
	});

	if (fetchedSession) {
		const { user, session } = fetchedSession;
		event.locals.session = session;
		event.locals.user = user;
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	if (event.url.pathname.startsWith('/dashboard')) {
		if (!event.locals?.user || !event.locals?.session) {
			return new Response('Unauthorized', {
				status: 401,
				statusText: 'Unauthorized'
			});
		}
	}

	return svelteKitHandler({ event, resolve, auth });
}
