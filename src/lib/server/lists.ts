import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { listItems, lists, mediaItems } from "./db/schema";

export type ListSummary = {
	id: string;
	title: string;
	description: string | null;
	isPublic: boolean;
	itemCount: number;
	coverImageUrls: string[]; // first few items' covers, for a stacked preview thumbnail
	createdAt: Date;
};

export type ListItemDisplay = {
	id: string; // list_items row id (needed for remove/reorder, distinct from mediaItemId)
	mediaItemId: string;
	position: number;
	note: string | null;
	title: string;
	slug: string;
	mediaType: string;
	coverImageUrl: string | null;
};

export async function createList(userId: string, title: string, description: string | null, isPublic: boolean) {
	const [inserted] = await db
		.insert(lists)
		.values({ userId, title, description, isPublic })
		.returning({ id: lists.id });
	return inserted.id;
}

export async function updateListMeta(
	listId: string,
	fields: { title: string; description: string | null; isPublic: boolean },
) {
	await db
		.update(lists)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(lists.id, listId));
}

export async function deleteList(listId: string) {
	await db.delete(lists).where(eq(lists.id, listId));
}

/**
 * Lists belonging to a user. Callers viewing someone else's profile should
 * pass includePrivate=false; the owner viewing their own profile (or
 * managing their lists) passes true.
 */
export async function getListsForUser(userId: string, includePrivate: boolean): Promise<ListSummary[]> {
	const rows = await db
		.select({
			id: lists.id,
			title: lists.title,
			description: lists.description,
			isPublic: lists.isPublic,
			createdAt: lists.createdAt,
		})
		.from(lists)
		.where(includePrivate ? eq(lists.userId, userId) : and(eq(lists.userId, userId), eq(lists.isPublic, true)))
		.orderBy(sql`${lists.createdAt} desc`);

	const summaries: ListSummary[] = [];
	for (const row of rows) {
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(listItems)
			.where(eq(listItems.listId, row.id));

		const covers = await db
			.select({ coverImageUrl: mediaItems.coverImageUrl })
			.from(listItems)
			.innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
			.where(eq(listItems.listId, row.id))
			.orderBy(asc(listItems.position))
			.limit(4);

		summaries.push({
			...row,
			itemCount: count,
			coverImageUrls: covers.map((c) => c.coverImageUrl).filter((u): u is string => !!u),
		});
	}

	return summaries;
}

export async function getListWithItems(listId: string): Promise<{
	list: { id: string; userId: string; title: string; description: string | null; isPublic: boolean };
	items: ListItemDisplay[];
} | null> {
	const [list] = await db
		.select({
			id: lists.id,
			userId: lists.userId,
			title: lists.title,
			description: lists.description,
			isPublic: lists.isPublic,
		})
		.from(lists)
		.where(eq(lists.id, listId))
		.limit(1);

	if (!list) return null;

	const items = await db
		.select({
			id: listItems.id,
			mediaItemId: listItems.mediaItemId,
			position: listItems.position,
			note: listItems.note,
			title: mediaItems.title,
			slug: mediaItems.slug,
			mediaType: mediaItems.mediaType,
			coverImageUrl: mediaItems.coverImageUrl,
		})
		.from(listItems)
		.innerJoin(mediaItems, eq(listItems.mediaItemId, mediaItems.id))
		.where(eq(listItems.listId, listId))
		.orderBy(asc(listItems.position));

	return { list, items };
}

/** Which of a user's lists already contain a given media item — for the "Add to list" picker's checkbox states. */
export async function getUserListsWithMembership(userId: string, mediaItemId: string) {
	const userLists = await db
		.select({ id: lists.id, title: lists.title })
		.from(lists)
		.where(eq(lists.userId, userId))
		.orderBy(sql`${lists.createdAt} desc`);

	const memberships = await db
		.select({ listId: listItems.listId })
		.from(listItems)
		.where(eq(listItems.mediaItemId, mediaItemId));
	const memberListIds = new Set(memberships.map((m) => m.listId));

	return userLists.map((l) => ({ ...l, inList: memberListIds.has(l.id) }));
}

/** Appends to the end. No-ops (doesn't throw) if the item's already in the list, thanks to the unique constraint. */
export async function addItemToList(listId: string, mediaItemId: string) {
	const [{ maxPosition }] = await db
		.select({ maxPosition: sql<number>`coalesce(max(${listItems.position}), 0)::int` })
		.from(listItems)
		.where(eq(listItems.listId, listId));

	await db
		.insert(listItems)
		.values({ listId, mediaItemId, position: maxPosition + 1 })
		.onConflictDoNothing();
}

export async function removeItemFromList(listId: string, mediaItemId: string) {
	await db.delete(listItems).where(and(eq(listItems.listId, listId), eq(listItems.mediaItemId, mediaItemId)));
}

/**
 * Moves an item one slot earlier/later by swapping its position with its
 * immediate neighbor. Simple swap rather than a full renumbering pass —
 * fine at expected list sizes (tens of items, not thousands).
 */
export async function moveListItem(listId: string, itemId: string, direction: "up" | "down") {
	const items = await db
		.select({ id: listItems.id, position: listItems.position })
		.from(listItems)
		.where(eq(listItems.listId, listId))
		.orderBy(asc(listItems.position));

	const index = items.findIndex((i) => i.id === itemId);
	if (index === -1) return;

	const swapIndex = direction === "up" ? index - 1 : index + 1;
	if (swapIndex < 0 || swapIndex >= items.length) return; // already at the edge, nothing to do

	const current = items[index];
	const swapWith = items[swapIndex];

	await db.transaction(async (tx) => {
		await tx.update(listItems).set({ position: swapWith.position }).where(eq(listItems.id, current.id));
		await tx.update(listItems).set({ position: current.position }).where(eq(listItems.id, swapWith.id));
	});
}
