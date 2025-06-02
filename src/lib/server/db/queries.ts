import { eq } from 'drizzle-orm';
import { db } from './index';
import type { SelectUser } from './schema';
import { userTable } from './schema';

export async function getUserByUsername(name: SelectUser['name']): Promise<
	Array<{
		id: number;
		name: string;
		image: string;
	}>
> {
	const result = await db
		.select({ id: userTable.id, name: userTable.name, image: userTable.image })
		.from(userTable)
		.where(eq(userTable.name, name));
	return result.map((row) => ({
		id: typeof row.id === 'string' ? parseInt(row.id, 10) : row.id,
		name: row.name,
		image: row.image || ''
	}));
}
