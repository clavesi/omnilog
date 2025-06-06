import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// If logged in, redirect to home
	if (locals.user || locals.session) {
		throw redirect(302, '/');
	}
}
