	import { db } from '$lib/server/db';
	import * as schema from '$lib/server/db/schema';

	export const load = async () => {
		const users = await db.query(schema).user.findMany();
		return { users };
	};
