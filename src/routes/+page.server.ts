import { getOrCreateUser } from "$lib/auth";
import { db } from "$lib/db";
import { UserTable } from "$lib/db/schema.js";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { zfd } from "zod-form-data";

export const load = async ({ locals }) => {
	const userProfile = await getOrCreateUser(locals);

	return {
		userProfile
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const userProfile = await getOrCreateUser(locals);

		if (!userProfile) {
			error(401, "You need to be logged in!");
		}

		const schema = zfd.formData({
			email: zfd.text(),
			name: zfd.text(),
			username: zfd.text()
		});

		const { data } = schema.safeParse(await request.formData());

		if (!data) {
			error(400, "Invalid form data");
		}

		await db
			.update(UserTable)
			.set({
				email: data.email,
				name: data.name,
				username: data.username
			})
			.where(eq(UserTable.id, userProfile.id));

		return { success: true };
	}
};
