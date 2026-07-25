import { hash, verify } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { and, eq, ne } from "drizzle-orm";
import { deleteSessionTokenCookie, requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { sessions, users } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

const ARGON2_PARAMS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export const load: PageServerLoad = (event) => {
	const user = requireUser(event);
	return {
		profile: { username: user.username, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio },
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();

		const avatarUrl = String(form.get("avatarUrl") ?? "").trim() || null;
		const bio = String(form.get("bio") ?? "").trim() || null;

		if (avatarUrl && avatarUrl.length > 500) {
			return fail(400, { profileError: "Avatar URL is too long" });
		}
		if (bio && bio.length > 500) {
			return fail(400, { profileError: "Bio must be 500 characters or fewer" });
		}

		await db.update(users).set({ avatarUrl, bio, updatedAt: new Date() }).where(eq(users.id, user.id));
		return { profileSuccess: true };
	},

	updateEmail: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();

		const newEmail = String(form.get("email") ?? "").trim();
		const currentPassword = String(form.get("currentPassword") ?? "");

		if (!newEmail?.includes("@") || newEmail.length > 255) {
			return fail(400, { emailError: "Invalid email" });
		}

		const validPassword = await verify(user.passwordHash, currentPassword, ARGON2_PARAMS);
		if (!validPassword) {
			return fail(400, { emailError: "Incorrect password" });
		}

		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.email, newEmail), ne(users.id, user.id)))
			.limit(1);
		if (existing) {
			return fail(400, { emailError: "That email is already in use" });
		}

		// No email verification flow exists yet (needs the password-reset
		// infra's email-sending integration first) — this applies
		// immediately. Worth revisiting once that's built.
		await db.update(users).set({ email: newEmail, updatedAt: new Date() }).where(eq(users.id, user.id));
		return { emailSuccess: true };
	},

	updatePassword: async (event) => {
		const user = requireUser(event);
		const { locals, request } = event;
		const form = await request.formData();

		const currentPassword = String(form.get("currentPassword") ?? "");
		const newPassword = String(form.get("newPassword") ?? "");
		const confirmPassword = String(form.get("confirmPassword") ?? "");

		if (newPassword.length < 8 || newPassword.length > 255) {
			return fail(400, { passwordError: "New password must be at least 8 characters" });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: "New passwords don't match" });
		}

		const validPassword = await verify(user.passwordHash, currentPassword, ARGON2_PARAMS);
		if (!validPassword) {
			return fail(400, { passwordError: "Incorrect current password" });
		}

		const newHash = await hash(newPassword, ARGON2_PARAMS);
		await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id));

		// Log out any other active sessions — if the old password had been
		// compromised, this cuts off anything already logged in with it.
		// Keeps the current session (the one making this change) alive.
		const currentSessionId = locals.session?.id;
		if (currentSessionId) {
			await db.delete(sessions).where(and(eq(sessions.userId, user.id), ne(sessions.id, currentSessionId)));
		}

		return { passwordSuccess: true };
	},

	deleteAccount: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();

		const currentPassword = String(form.get("currentPassword") ?? "");
		const confirmText = String(form.get("confirmText") ?? "");

		if (confirmText !== "DELETE") {
			return fail(400, { deleteError: 'Type "DELETE" to confirm' });
		}

		const validPassword = await verify(user.passwordHash, currentPassword, ARGON2_PARAMS);
		if (!validPassword) {
			return fail(400, { deleteError: "Incorrect password" });
		}

		// Cascades everything — sessions, logs, favorites, lists, statuses —
		// via the existing onDelete: cascade foreign keys throughout the
		// schema. Nothing extra to clean up manually here.
		await db.delete(users).where(eq(users.id, user.id));

		deleteSessionTokenCookie(event);
		redirect(303, "/");
	},
};
