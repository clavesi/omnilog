import { and, count, eq, inArray } from "drizzle-orm";
import { isValidReaction } from "$lib/reactions";
import { db } from "./db";
import { logReactions, logs } from "./db/schema";

export type ReactionSummary = {
	emoji: string;
	count: number;
	/** Whether the current viewer is one of the reactors. */
	reacted: boolean;
};

/**
 * Set, switch, or clear a user's reaction on a log. Returns true if they now
 * hold a reaction, false if they cleared it.
 *
 * One reaction per person per log: clicking the one you already hold removes
 * it, clicking a different one replaces it. The unique index on (log, user)
 * enforces this at the database level too.
 */
export async function toggleReaction(logId: string, userId: string, emoji: string): Promise<boolean> {
	if (!isValidReaction(emoji)) throw new Error("Unknown reaction");

	// Reactions follow the log's visibility — there's no separate policy for
	// them, since they carry no content to moderate.
	const [log] = await db
		.select({ userId: logs.userId, isPublic: logs.isPublic })
		.from(logs)
		.where(eq(logs.id, logId))
		.limit(1);

	if (!log) throw new Error("Log not found");
	if (!log.isPublic && log.userId !== userId) throw new Error("Not allowed to react to this log");

	const [existing] = await db
		.select({ id: logReactions.id, emoji: logReactions.emoji })
		.from(logReactions)
		.where(and(eq(logReactions.logId, logId), eq(logReactions.userId, userId)))
		.limit(1);

	if (existing) {
		// Same emoji again means "undo"; a different one means "change my mind".
		if (existing.emoji === emoji) {
			await db.delete(logReactions).where(eq(logReactions.id, existing.id));
			return false;
		}
		await db.update(logReactions).set({ emoji, createdAt: new Date() }).where(eq(logReactions.id, existing.id));
		return true;
	}

	await db.insert(logReactions).values({ logId, userId, emoji }).onConflictDoNothing();
	return true;
}

/**
 * Reaction tallies for one log, flagged with which one the viewer picked.
 * At most one entry can have `reacted: true`.
 */
export async function getReactions(logId: string, viewerId: string | null): Promise<ReactionSummary[]> {
	const rows = await db
		.select({ emoji: logReactions.emoji, userId: logReactions.userId })
		.from(logReactions)
		.where(eq(logReactions.logId, logId));

	const tally = new Map<string, { count: number; reacted: boolean }>();
	for (const r of rows) {
		const entry = tally.get(r.emoji) ?? { count: 0, reacted: false };
		entry.count += 1;
		if (viewerId && r.userId === viewerId) entry.reacted = true;
		tally.set(r.emoji, entry);
	}

	return [...tally.entries()]
		.map(([emoji, v]) => ({ emoji, count: v.count, reacted: v.reacted }))
		.sort((a, b) => b.count - a.count);
}

/**
 * Total reaction counts for a batch of logs, for feed and profile cards.
 * One grouped query rather than one per card.
 */
export async function getReactionCounts(logIds: string[]): Promise<Map<string, number>> {
	const counts = new Map<string, number>();
	if (logIds.length === 0) return counts;

	const rows = await db
		.select({ logId: logReactions.logId, total: count() })
		.from(logReactions)
		.where(inArray(logReactions.logId, logIds))
		.groupBy(logReactions.logId);

	for (const r of rows) counts.set(r.logId, r.total);
	return counts;
}
