import { error, fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { isMediaStatus } from "$lib/media-status";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { genres, mediaGenres, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { getFavoriteForType, removeFavorite, setFavorite } from "$lib/server/favorites";
import { addItemToList, createList, getUserListsWithMembership, removeItemFromList } from "$lib/server/lists";
import { getLogsForMediaItem } from "$lib/server/logs";
import { clearStatus, getStatus, setStatus } from "$lib/server/media-status";
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
	const status = currentUserId ? await getStatus(currentUserId, item.id) : null;

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
		status,
		currentUserId,
		isFavorite,
		userLists,
	};
};

export const actions: Actions = {
	setStatus: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const raw = String(form.get("status") ?? "");

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, event.params.slug))
			.limit(1);
		if (!item) return fail(404, { error: "Media not found" });

		// Empty means "no status" — remove the row rather than storing a
		// sentinel, so an untracked item and a cleared one look identical.
		if (raw === "") {
			await clearStatus(user.id, item.id);
			return { success: true };
		}

		if (!isMediaStatus(raw)) return fail(400, { error: "Invalid status" });

		const progressRaw = form.get("progress");
		const parsedProgress = progressRaw != null && String(progressRaw).trim() !== "" ? Number(progressRaw) : null;
		if (parsedProgress !== null && (!Number.isInteger(parsedProgress) || parsedProgress < 0)) {
			return fail(400, { error: "Progress must be a whole number" });
		}

		await setStatus({ userId: user.id, mediaItemId: item.id, status: raw, progress: parsedProgress });
		return { success: true };
	},

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
