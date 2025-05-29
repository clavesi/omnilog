import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// If logged in, redirect to home
	if (locals.user || locals.session) {
		throw redirect(302, '/');
	}
};
