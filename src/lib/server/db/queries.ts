import { eq } from 'drizzle-orm';
import { db } from './index';
import type { SelectUser } from './schema';
import { user } from './schema';

export async function getUserByUsername(name: SelectUser['name']): Promise<
	Array<{
		id: number;
		name: string;
		image: string;
	}>
> {
	const result = await db
		.select({ id: user.id, name: user.name, image: user.image })
		.from(user)
		.where(eq(user.name, name));
	return result.map((row) => ({
		id: typeof row.id === 'string' ? parseInt(row.id, 10) : row.id,
		name: row.name,
		image: row.image || ''
	}));
}
