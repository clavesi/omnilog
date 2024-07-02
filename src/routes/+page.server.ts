import { db } from "$lib/db";

export async function load() {
	const users = await db.query.UserTable.findMany();

	return {
		users
	};
}
