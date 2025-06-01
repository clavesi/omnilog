import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Not logged in
	if (!locals.user || !locals.session) {
		redirect(302, '/sign-in');
	}
}
