// src/lib/server/password-reset.ts
import { desc, eq } from "drizzle-orm";
import { constantTimeEqual, generateSecureRandomString, hashSecret } from "./auth";
import { db } from "./db";
import { passwordResetTokens, users } from "./db/schema";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
// TODO: real rate limiting
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Creates a reset token for the given user and returns the RAW token (only
 * ever held in memory here, for embedding in the emailed link)
 *
 * Returns null (and creates nothing) if a still-valid token was already
 * issued within the cooldown window, so repeatedly submitting the "forgot
 * password" form doesn't queue up an email per click.
 */
export async function createPasswordResetToken(userId: string): Promise<string | null> {
	const [recent] = await db
		.select({ createdAt: passwordResetTokens.createdAt })
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.userId, userId))
		.orderBy(desc(passwordResetTokens.createdAt))
		.limit(1);

	if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
		return null;
	}

	const rawToken = generateSecureRandomString();
	const tokenHash = await hashSecret(rawToken);
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

	await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });

	return rawToken;
}

/**
 * Validates a raw token from a reset link. On success, consumes it and returns the associated userId.
 * On failure (not found, expired, hash mismatch), returns null and leaves any matching row alone rather than guessing which one to delete.
 */
export async function validateAndConsumeResetToken(rawToken: string): Promise<string | null> {
	const candidates = await db
		.select({
			id: passwordResetTokens.id,
			userId: passwordResetTokens.userId,
			tokenHash: passwordResetTokens.tokenHash,
			expiresAt: passwordResetTokens.expiresAt,
		})
		.from(passwordResetTokens);

	const providedHash = await hashSecret(rawToken);

	for (const candidate of candidates) {
		if (!constantTimeEqual(providedHash, candidate.tokenHash)) continue;

		// Found the matching token — consume it regardless of whether it's
		// expired, so a stale link can't be retried indefinitely.
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, candidate.id));

		if (candidate.expiresAt.getTime() < Date.now()) return null;
		return candidate.userId;
	}

	return null;
}

export async function getUserByEmail(email: string) {
	const [user] = await db
		.select({ id: users.id, email: users.email })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	return user ?? null;
}
