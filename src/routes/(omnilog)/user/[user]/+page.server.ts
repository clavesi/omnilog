import { error } from '@sveltejs/kit';
import { getUserByUsername } from '$lib/server/db/queries';

export async function load({ params }) {
	const users = await getUserByUsername(params.user);
	const user = users[0];
	if (!user) {
		throw error(404, 'User not found');
	}

	return { user };
}
