import { hash } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { sessions, users } from "$lib/server/db/schema";
import { validateAndConsumeResetToken } from "$lib/server/password-reset";
import type { Actions, PageServerLoad } from "./$types";

const ARGON2_PARAMS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export const load: PageServerLoad = (event) => {
	return { token: event.url.searchParams.get("token") };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const token = String(form.get("token") ?? "");
		const newPassword = String(form.get("newPassword") ?? "");
		const confirmPassword = String(form.get("confirmPassword") ?? "");

		if (!token) return fail(400, { message: "Missing reset token" });
		if (newPassword.length < 8 || newPassword.length > 255) {
			return fail(400, { message: "Password must be at least 8 characters" });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: "Passwords don't match" });
		}

		const userId = await validateAndConsumeResetToken(token);
		if (!userId) {
			return fail(400, { message: "This reset link is invalid or has expired — request a new one." });
		}

		const passwordHash = await hash(newPassword, ARGON2_PARAMS);

		await db.transaction(async (tx) => {
			await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
			await tx.delete(sessions).where(eq(sessions.userId, userId));
		});

		redirect(303, "/login?reset=success");
	},
};
