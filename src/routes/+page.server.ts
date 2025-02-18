import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;

	if (user) {
		console.log('user', user);
		return { user };
	}

	return { user: null };
};
