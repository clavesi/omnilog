import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { logComments, logs, users } from "./db/schema";
import { getFollowStatus } from "./follows";

export const MAX_COMMENT_LENGTH = 2000;

export type CommentAuthor = { id: string; username: string; image: string | null };

export type CommentNode = {
	id: string;
	body: string;
	createdAt: Date;
	editedAt: Date | null;
	author: CommentAuthor;
	replies: CommentNode[];
};

/** Why a viewer can't comment, or null if they can. */
export type CommentDenial = "not_signed_in" | "closed" | "followers_only" | "log_not_visible";

/**
 * Whether `viewerId` may comment on a log.
 *
 * The log author is always allowed on their own log, including when the
 * policy is "nobody" — that setting is about other people, and locking the
 * author out of their own thread would be surprising.
 */
export async function canComment(logId: string, viewerId: string | null): Promise<CommentDenial | null> {
	if (!viewerId) return "not_signed_in";

	const [log] = await db
		.select({ userId: logs.userId, isPublic: logs.isPublic, commentPolicy: logs.commentPolicy })
		.from(logs)
		.where(eq(logs.id, logId))
		.limit(1);

	if (!log) return "log_not_visible";
	if (log.userId === viewerId) return null;
	if (!log.isPublic) return "log_not_visible";

	if (log.commentPolicy === "nobody") return "closed";
	if (log.commentPolicy === "followers") {
		// "Followers" means people the author has accepted — the viewer
		// follows the author, not the other way round.
		const status = await getFollowStatus(viewerId, log.userId);
		if (status !== "accepted") return "followers_only";
	}

	return null;
}

/**
 * Add a comment or a reply.
 *
 * Replies are limited to one level: replying to a reply attaches to that
 * reply's parent instead of nesting deeper, which is friendlier than
 * rejecting the write and matches what the UI offers.
 *
 * Returns the parent's author alongside the new id so the caller can notify
 * them without re-reading the thread — which would also miss a parent that
 * had been soft-deleted.
 */
export async function addComment(params: {
	logId: string;
	userId: string;
	body: string;
	parentCommentId?: string | null;
}): Promise<{ id: string; parentAuthorId: string | null }> {
	const body = params.body.trim();
	if (!body) throw new Error("Comment body is required");
	if (body.length > MAX_COMMENT_LENGTH) throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`);

	let parentCommentId: string | null = null;
	let parentAuthorId: string | null = null;

	if (params.parentCommentId) {
		const [parent] = await db
			.select({
				id: logComments.id,
				logId: logComments.logId,
				userId: logComments.userId,
				parentCommentId: logComments.parentCommentId,
			})
			.from(logComments)
			.where(eq(logComments.id, params.parentCommentId))
			.limit(1);

		if (!parent || parent.logId !== params.logId) throw new Error("Parent comment not found on this log");
		// Flatten: a reply to a reply belongs to the same top-level thread.
		parentCommentId = parent.parentCommentId ?? parent.id;
		// Notify whoever was actually replied to, which is the comment the
		// user clicked — not necessarily the thread root after flattening.
		parentAuthorId = parent.userId;
	}

	const [inserted] = await db
		.insert(logComments)
		.values({ logId: params.logId, userId: params.userId, body, parentCommentId })
		.returning({ id: logComments.id });

	return { id: inserted.id, parentAuthorId };
}

/**
 * Delete a comment outright. Only the comment's author or the log's author
 * may do this — a log owner needs to be able to clear their own thread.
 *
 * Deleting a top-level comment takes its replies with it, via the cascading
 * self-reference on parent_comment_id.
 */
export async function deleteComment(commentId: string, viewerId: string): Promise<void> {
	const [row] = await db
		.select({ authorId: logComments.userId, logAuthorId: logs.userId })
		.from(logComments)
		.innerJoin(logs, eq(logs.id, logComments.logId))
		.where(eq(logComments.id, commentId))
		.limit(1);

	if (!row) throw new Error("Comment not found");
	if (row.authorId !== viewerId && row.logAuthorId !== viewerId) throw new Error("Not allowed to delete this comment");

	await db.delete(logComments).where(eq(logComments.id, commentId));
}

/** Edit a comment's body. Author only. */
export async function editComment(commentId: string, viewerId: string, body: string): Promise<void> {
	const trimmed = body.trim();
	if (!trimmed) throw new Error("Comment body is required");
	if (trimmed.length > MAX_COMMENT_LENGTH) {
		throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`);
	}

	await db
		.update(logComments)
		.set({ body: trimmed, editedAt: new Date() })
		.where(and(eq(logComments.id, commentId), eq(logComments.userId, viewerId)));
}

/**
 * Full comment thread for a log, top-level comments with their replies
 * nested underneath. Both levels are oldest-first, which reads naturally
 * for a conversation.
 *
 * Two queries regardless of thread size — one for the rows, one pass to
 * assemble — rather than a query per top-level comment.
 */
export async function getCommentThread(logId: string): Promise<CommentNode[]> {
	const rows = await db
		.select({
			id: logComments.id,
			body: logComments.body,
			createdAt: logComments.createdAt,
			editedAt: logComments.editedAt,
			parentCommentId: logComments.parentCommentId,
			authorId: users.id,
			authorUsername: users.username,
			authorImage: users.image,
		})
		.from(logComments)
		.innerJoin(users, eq(users.id, logComments.userId))
		.where(eq(logComments.logId, logId))
		.orderBy(asc(logComments.createdAt));

	const toNode = (r: (typeof rows)[number]): CommentNode => ({
		id: r.id,
		body: r.body,
		createdAt: r.createdAt,
		editedAt: r.editedAt,
		author: { id: r.authorId, username: r.authorUsername, image: r.authorImage },
		replies: [],
	});

	const topLevel: CommentNode[] = [];
	const byId = new Map<string, CommentNode>();

	for (const r of rows) {
		if (r.parentCommentId === null) {
			const node = toNode(r);
			byId.set(node.id, node);
			topLevel.push(node);
		}
	}

	for (const r of rows) {
		if (r.parentCommentId === null) continue;
		byId.get(r.parentCommentId)?.replies.push(toNode(r));
	}

	return topLevel;
}

/**
 * Comment counts for a batch of logs, for feed and profile cards.
 * One grouped query rather than one per card.
 */
export async function getCommentCounts(logIds: string[]): Promise<Map<string, number>> {
	const counts = new Map<string, number>();
	if (logIds.length === 0) return counts;

	const rows = await db
		.select({ logId: logComments.logId, total: count() })
		.from(logComments)
		.where(inArray(logComments.logId, logIds))
		.groupBy(logComments.logId);

	for (const r of rows) counts.set(r.logId, r.total);
	return counts;
}
