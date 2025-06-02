import { redirect } from '@sveltejs/kit';
import { getUserByUsername } from '$lib/server/db/queries';

export async function load({ locals }) {
	if (!locals.user || !locals.session) {
		redirect(302, '/sign-in');
	}

	console.log(locals.user);

	return { user: locals.user };
}
