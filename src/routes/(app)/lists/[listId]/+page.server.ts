import { error, redirect } from "@sveltejs/kit";
import {
	deleteList,
	getListWithItems,
	moveListItem,
	removeItemFromList,
	requireListOwner,
	updateListMeta,
} from "$lib/server/lists";
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
		const check = await requireListOwner(params.listId, locals.user?.id);
		if ("status" in check) return check;

		const form = await request.formData();
		const title = String(form.get("title") ?? "").trim();
		const description = String(form.get("description") ?? "").trim() || null;
		const isPublic = form.get("isPublic") === "on";

		if (!title) return { error: "Title is required" };

		await updateListMeta(params.listId, { title, description, isPublic });
		return { success: true };
	},

	removeItem: async ({ request, params, locals }) => {
		const check = await requireListOwner(params.listId, locals.user?.id);
		if ("status" in check) return check;

		const form = await request.formData();
		const mediaItemId = String(form.get("mediaItemId") ?? "");
		if (!mediaItemId) return { error: "Missing media item id" };

		await removeItemFromList(params.listId, mediaItemId);
		return { success: true };
	},

	moveItem: async ({ request, params, locals }) => {
		const check = await requireListOwner(params.listId, locals.user?.id);
		if ("status" in check) return check;

		const form = await request.formData();
		const itemId = String(form.get("itemId") ?? "");
		const direction = form.get("direction") === "up" ? "up" : "down";
		if (!itemId) return { error: "Missing item id" };

		await moveListItem(params.listId, itemId, direction);
		return { success: true };
	},

	delete: async ({ params, locals }) => {
		const check = await requireListOwner(params.listId, locals.user?.id);
		if ("status" in check) return check;

		await deleteList(params.listId);
		redirect(303, `/u/${locals.user?.username}`);
	},
};
