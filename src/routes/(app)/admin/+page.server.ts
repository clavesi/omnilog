import { fail } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { requireAdmin, requireOwner } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	// Admins can view (they already have page access for arc/saga
	// management) but only the owner can actually change anyone's role —
	// see the toggleAdmin action below and requireOwner() in auth.ts.
	const viewer = requireAdmin(event);

	const allUsers = await db
		.select({
			id: users.id,
			username: users.username,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt,
		})
		.from(users)
		.orderBy(desc(users.createdAt));

	return { users: allUsers, currentUserId: viewer.id, isOwner: viewer.role === "owner" };
};

export const actions: Actions = {
	toggleAdmin: async (event) => {
		const owner = requireOwner(event);
		const { request } = event;

		const form = await request.formData();
		const userId = String(form.get("userId") ?? "");
		if (!userId) return fail(400, { error: "Missing user id" });

		// Redundant with requireOwner in practice (the owner IS the only
		// one who can reach this action), but kept as a direct guard against
		// self-demotion specifically, since there's no UI to re-promote a
		// new owner if this ever changes.
		if (userId === owner.id) {
			return fail(400, { error: "You can't change your own role" });
		}

		const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
		if (!target) return fail(404, { error: "User not found" });

		if (target.role === "owner") {
			return fail(400, { error: "Can't change the owner's role" });
		}

		const newRole = target.role === "admin" ? "user" : "admin";
		await db.update(users).set({ role: newRole, updatedAt: new Date() }).where(eq(users.id, userId));

		return { success: true };
	},
};
