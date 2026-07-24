import { error, fail, redirect } from "@sveltejs/kit";
import { deleteList, getListWithItems, moveListItem, removeItemFromList, updateListMeta } from "$lib/server/lists";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const result = await getListWithItems(params.listId);
	if (!result) throw error(404, "List not found");

	const isOwner = locals.user?.id === result.list.userId;
	if (!result.list.isPublic && !isOwner) throw error(404, "List not found");

	return { list: result.list, items: result.items, isOwner };
};

export const actions: Actions = {
	updateMeta: async ({ request, params, locals }) => {
		const existing = await getListWithItems(params.listId);
		if (!existing) return fail(404, { error: "List not found" });
		if (!locals.user || locals.user.id !== existing.list.userId) return fail(403, { error: "Not your list" });

		const form = await request.formData();
		const title = String(form.get("title") ?? "").trim();
		const description = String(form.get("description") ?? "").trim() || null;
		const isPublic = form.get("isPublic") === "on";

		if (!title) return fail(400, { error: "Title is required" });

		await updateListMeta(params.listId, { title, description, isPublic });
		return { success: true };
	},

	removeItem: async ({ request, params, locals }) => {
		const existing = await getListWithItems(params.listId);
		if (!existing) return fail(404, { error: "List not found" });
		if (!locals.user || locals.user.id !== existing.list.userId) return fail(403, { error: "Not your list" });

		const form = await request.formData();
		const mediaItemId = String(form.get("mediaItemId") ?? "");
		if (!mediaItemId) return fail(400, { error: "Missing media item id" });

		await removeItemFromList(params.listId, mediaItemId);
		return { success: true };
	},

	moveItem: async ({ request, params, locals }) => {
		const existing = await getListWithItems(params.listId);
		if (!existing) return fail(404, { error: "List not found" });
		if (!locals.user || locals.user.id !== existing.list.userId) return fail(403, { error: "Not your list" });

		const form = await request.formData();
		const itemId = String(form.get("itemId") ?? "");
		const direction = form.get("direction") === "up" ? "up" : "down";
		if (!itemId) return fail(400, { error: "Missing item id" });

		await moveListItem(params.listId, itemId, direction);
		return { success: true };
	},

	delete: async ({ params, locals }) => {
		const existing = await getListWithItems(params.listId);
		if (!existing) return fail(404, { error: "List not found" });
		if (!locals.user || locals.user.id !== existing.list.userId) return fail(403, { error: "Not your list" });

		await deleteList(params.listId);
		redirect(303, `/u/${locals.user.username}`);
	},
};
