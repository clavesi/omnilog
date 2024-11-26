import { db } from '$lib/server/db/index';

export async function load() {
	const users = await db.query.usersTable.findMany();
	return { users };
}
