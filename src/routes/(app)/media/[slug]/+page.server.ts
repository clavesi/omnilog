import { error, fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { genres, mediaGenres, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { getFavoriteForType, removeFavorite, setFavorite } from "$lib/server/favorites";
import { addItemToList, createList, getUserListsWithMembership, removeItemFromList } from "$lib/server/lists";
import { getLogsForMediaItem } from "$lib/server/logs";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db.select().from(mediaItems).where(eq(mediaItems.slug, params.slug)).limit(1);

	if (!item) throw error(404, "Not found");

	const [meta] = await db.select().from(mediaMetadata).where(eq(mediaMetadata.mediaItemId, item.id)).limit(1);

	const itemGenres = await db
		.select({ name: genres.name, slug: genres.slug })
		.from(mediaGenres)
		.innerJoin(genres, eq(mediaGenres.genreId, genres.id))
		.where(eq(mediaGenres.mediaItemId, item.id));

	const currentUserId = locals.user?.id ?? null;
	// Item is already loaded — attach media fields in JS instead of joining again.
	const logs = await getLogsForMediaItem(item.id, currentUserId, item);

	// Is this item the viewer's current favorite for its media type?
	let isFavorite = false;
	if (currentUserId) {
		const favId = await getFavoriteForType(currentUserId, item.mediaType);
		isFavorite = favId === item.id;
	}

	const userLists = currentUserId ? await getUserListsWithMembership(currentUserId, item.id) : [];

	return {
		item,
		metadata: meta?.metadata ?? null,
		genres: itemGenres,
		logs,
		currentUserId,
		isFavorite,
		userLists,
	};
};

export const actions: Actions = {
	toggleFavorite: async (event) => {
		const user = requireUser(event);
		const { params } = event;

		const [item] = await db
			.select({ id: mediaItems.id, mediaType: mediaItems.mediaType })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);

		if (!item) return fail(404, { error: "Media not found" });

		const currentFavoriteId = await getFavoriteForType(user.id, item.mediaType);

		if (currentFavoriteId === item.id) {
			// Already the favorite, toggle off.
			await removeFavorite(user.id, item.mediaType);
			return { isFavorite: false };
		}

		// Either no favorite set for this type yet, or a different item was.
		// setFavorite upserts, so this replaces any existing favorite of that type.
		await setFavorite(user.id, item.id, item.mediaType);
		return { isFavorite: true };
	},

	toggleListItem: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);
		if (!item) return fail(404, { error: "Media not found" });

		const form = await request.formData();
		const listId = String(form.get("listId") ?? "");
		const inList = form.get("inList") === "true";
		if (!listId) return fail(400, { error: "Missing list id" });

		if (inList) {
			await removeItemFromList(listId, item.id);
		} else {
			await addItemToList(listId, item.id);
		}

		const userLists = await getUserListsWithMembership(user.id, item.id);
		return { userLists };
	},

	createListWithItem: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);
		if (!item) return fail(404, { error: "Media not found" });

		const form = await request.formData();
		const title = String(form.get("title") ?? "").trim();
		if (!title) return fail(400, { error: "Title is required" });

		const listId = await createList(user.id, title, null, true);
		await addItemToList(listId, item.id);

		const userLists = await getUserListsWithMembership(user.id, item.id);
		return { userLists };
	},
};
