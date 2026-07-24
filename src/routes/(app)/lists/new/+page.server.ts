import { fail, redirect } from "@sveltejs/kit";
import { requireUser } from "$lib/server/auth";
import { createList } from "$lib/server/lists";
import type { Actions } from "./$types";

export const load = (event) => {
	requireUser(event);
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();

		const title = String(form.get("title") ?? "").trim();
		const description = String(form.get("description") ?? "").trim() || null;
		const isPublic = form.get("isPublic") === "on";

		if (!title) return fail(400, { error: "Title is required" });

		const listId = await createList(user.id, title, description, isPublic);
		redirect(303, `/lists/${listId}`);
	},
};
