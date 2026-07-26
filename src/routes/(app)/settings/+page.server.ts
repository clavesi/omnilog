import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { auth, requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = (event) => {
	const user = requireUser(event);
	return {
		profile: { username: user.username, email: user.email, imageURL: user.image, bio: user.bio },
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();

		const image = String(form.get("image") ?? "").trim() || null;
		const bio = String(form.get("bio") ?? "").trim() || null;

		if (image && image.length > 500) {
			return fail(400, { profileError: "Image URL is too long" });
		}
		if (bio && bio.length > 500) {
			return fail(400, { profileError: "Bio must be 500 characters or fewer" });
		}

		await db.update(users).set({ image, bio, updatedAt: new Date() }).where(eq(users.id, user.id));
		return { profileSuccess: true };
	},

	updateEmail: async (event) => {
		requireUser(event);
		const form = await event.request.formData();

		const newEmail = String(form.get("email") ?? "").trim();

		if (!newEmail?.includes("@") || newEmail.length > 255) {
			return fail(400, { emailError: "Invalid email" });
		}

		try {
			await auth.api.changeEmail({
				body: { newEmail },
				headers: event.request.headers,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not update email";
			return fail(400, { emailError: message });
		}

		return { emailSuccess: true };
	},

	updatePassword: async (event) => {
		requireUser(event);
		const form = await event.request.formData();

		const currentPassword = String(form.get("currentPassword") ?? "");
		const newPassword = String(form.get("newPassword") ?? "");
		const confirmPassword = String(form.get("confirmPassword") ?? "");

		if (newPassword.length < 8 || newPassword.length > 255) {
			return fail(400, { passwordError: "New password must be at least 8 characters" });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: "New passwords don't match" });
		}

		try {
			// revokeOtherSessions: keeps the current session alive but signs out everywhere else
			await auth.api.changePassword({
				body: { currentPassword, newPassword, revokeOtherSessions: true },
				headers: event.request.headers,
			});
		} catch {
			return fail(400, { passwordError: "Incorrect current password" });
		}

		return { passwordSuccess: true };
	},

	deleteAccount: async (event) => {
		requireUser(event);
		const form = await event.request.formData();

		const currentPassword = String(form.get("currentPassword") ?? "");
		const confirmText = String(form.get("confirmText") ?? "");

		if (confirmText !== "DELETE") {
			return fail(400, { deleteError: 'Type "DELETE" to confirm' });
		}

		try {
			// Cascades everything
			await auth.api.deleteUser({
				body: { password: currentPassword },
				headers: event.request.headers,
			});
		} catch {
			return fail(400, { deleteError: "Incorrect password" });
		}

		redirect(303, "/");
	},
};
