import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
	if (!username || username.length < 3) {
		return false;
	}

	// Validate username format: alphanumeric, underscore, hyphen, 3-20 chars
	if (!/^[a-z0-9_-]{3,20}$/i.test(username)) {
		return false;
	}

	const normalizedUsername = username.toLowerCase();
	const existingUser = await db
		.select()
		.from(user)
		.where(eq(user.username, normalizedUsername))
		.limit(1);

	return existingUser.length === 0;
}
