import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { parseTagList, tagSlug } from "$lib/tags";
import { db } from "./db";
import { logs, logTags, tags } from "./db/schema";

export type TagRef = { id: string; name: string; slug: string };
export type TagWithCount = TagRef & { count: number };

/**
 * Resolve display names to tag rows, creating any that don't exist yet.
 *
 * `onConflictDoNothing` on the slug index means two people tagging the same
 * thing at once can't collide; the second insert no-ops and the follow-up
 * select picks up whichever row won.
 */
async function upsertTags(names: string[]): Promise<TagRef[]> {
	if (names.length === 0) return [];

	const rows = names.map((name) => ({ name, slug: tagSlug(name) }));
	await db.insert(tags).values(rows).onConflictDoNothing({ target: tags.slug });

	return db
		.select({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.where(
			inArray(
				tags.slug,
				rows.map((r) => r.slug),
			),
		);
}

/**
 * Replace a log's tags wholesale. Passing an empty list clears them.
 *
 * Replace rather than merge because the form always submits the complete
 * set — a diff would make removing the last tag indistinguishable from not
 * touching them.
 */
export async function setLogTags(logId: string, rawInput: string): Promise<void> {
	const names = parseTagList(rawInput);
	const resolved = await upsertTags(names);

	await db.transaction(async (tx) => {
		await tx.delete(logTags).where(eq(logTags.logId, logId));
		if (resolved.length > 0) {
			await tx.insert(logTags).values(resolved.map((t) => ({ logId, tagId: t.id })));
		}
	});
}

/**
 * Tags for a batch of logs, keyed by log id. One grouped query for the whole
 * page — same reasoning as the comment and reaction counts.
 */
export async function getTagsForLogs(logIds: string[]): Promise<Map<string, TagRef[]>> {
	const byLog = new Map<string, TagRef[]>();
	if (logIds.length === 0) return byLog;

	const rows = await db
		.select({ logId: logTags.logId, id: tags.id, name: tags.name, slug: tags.slug })
		.from(logTags)
		.innerJoin(tags, eq(tags.id, logTags.tagId))
		.where(inArray(logTags.logId, logIds))
		.orderBy(asc(tags.name));

	for (const r of rows) {
		const list = byLog.get(r.logId) ?? [];
		list.push({ id: r.id, name: r.name, slug: r.slug });
		byLog.set(r.logId, list);
	}

	return byLog;
}

/** The tags currently on one log, as a comma-separated string for the edit form. */
export async function getLogTagsInput(logId: string): Promise<string> {
	const byLog = await getTagsForLogs([logId]);
	return (byLog.get(logId) ?? []).map((t) => t.name).join(", ");
}

/**
 * A user's distinct tags with usage counts, most-used first.
 *
 * `includePrivate` is false when someone else is looking — tags on a private
 * log would otherwise leak both the tag and the fact that the log exists.
 */
export async function getUserTags(userId: string, includePrivate: boolean): Promise<TagWithCount[]> {
	const conditions = [eq(logs.userId, userId)];
	if (!includePrivate) conditions.push(eq(logs.isPublic, true));

	return db
		.select({ id: tags.id, name: tags.name, slug: tags.slug, count: count() })
		.from(logTags)
		.innerJoin(tags, eq(tags.id, logTags.tagId))
		.innerJoin(logs, eq(logs.id, logTags.logId))
		.where(and(...conditions))
		.groupBy(tags.id, tags.name, tags.slug)
		.orderBy(desc(count()), asc(tags.name));
}

/** Look up a tag by its slug. */
export async function getTagBySlug(slug: string): Promise<TagRef | null> {
	const [row] = await db
		.select({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.where(eq(tags.slug, slug))
		.limit(1);
	return row ?? null;
}

/**
 * Log ids belonging to `userId` carrying `tagId`, newest first.
 *
 * Returns ids rather than rows so the caller can feed them through
 * queryLogsWithMedia and get the same shape every other log listing uses,
 * counts and media joins included.
 */
export async function getUserLogIdsByTag(userId: string, tagId: string, includePrivate: boolean): Promise<string[]> {
	const conditions = [eq(logs.userId, userId), eq(logTags.tagId, tagId)];
	if (!includePrivate) conditions.push(eq(logs.isPublic, true));

	const rows = await db
		.select({ id: logs.id })
		.from(logTags)
		.innerJoin(logs, eq(logs.id, logTags.logId))
		.where(and(...conditions))
		.orderBy(desc(logs.loggedAt), desc(logs.createdAt));

	return rows.map((r) => r.id);
}

/**
 * Tag suggestions for the input's autocomplete — the user's own tags first,
 * since people reuse their own vocabulary far more than they discover others'.
 */
export async function getTagSuggestions(userId: string, limit = 30): Promise<string[]> {
	const rows = await db
		.select({ name: tags.name, uses: count() })
		.from(logTags)
		.innerJoin(tags, eq(tags.id, logTags.tagId))
		.innerJoin(logs, eq(logs.id, logTags.logId))
		.where(eq(logs.userId, userId))
		.groupBy(tags.id, tags.name)
		.orderBy(desc(count()), asc(tags.name))
		.limit(limit);

	return rows.map((r) => r.name);
}

/** Total distinct tags a user has used, for the profile link. */
export async function countUserTags(userId: string, includePrivate: boolean): Promise<number> {
	const conditions = [eq(logs.userId, userId)];
	if (!includePrivate) conditions.push(eq(logs.isPublic, true));

	const [row] = await db
		.select({ total: sql<number>`count(distinct ${logTags.tagId})::int` })
		.from(logTags)
		.innerJoin(logs, eq(logs.id, logTags.logId))
		.where(and(...conditions));

	return row?.total ?? 0;
}
