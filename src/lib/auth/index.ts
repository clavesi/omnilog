import { db } from "$lib/db";
import { UserTable } from "$lib/db/schema";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const getOrCreateUser = async (locals: App.Locals) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return null;
	}

	const curProfile = await db.query.UserTable.findFirst({
		where: eq(UserTable.id, user.id)
	});

	if (curProfile) {
		return curProfile;
	}

	await db.insert(UserTable).values({
		id: user.id,
		name: "",
		username: "",
		email: user.email ?? ""
	});

	const newProfile = await db.query.UserTable.findFirst({
		where: eq(UserTable.id, user.id)
	});

	if (!newProfile) {
		error(500, "Could not create profile");
	}

	return newProfile;
};
