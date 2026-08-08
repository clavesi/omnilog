import { error, fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { isCommentPolicy } from "$lib/comment-policy";
import { requireUser } from "$lib/server/auth";
import { addComment, canComment, deleteComment, editComment, getCommentThread } from "$lib/server/comments";
import { db } from "$lib/server/db";
import { logs, users } from "$lib/server/db/schema";
import { getFollowStatus } from "$lib/server/follows";
import { queryLogsWithMedia } from "$lib/server/logs";
import { createNotification } from "$lib/server/notifications";
import { getReactions, toggleReaction } from "$lib/server/reactions";
import type { Actions, PageServerLoad } from "./$types";

/**
 * A log is viewable if it's public and its author's account is visible to
 * the viewer — same rule the feed applies, enforced here too since this page
 * is directly linkable.
 */
async function requireViewableLog(logId: string, slug: string, viewerId: string | null) {
	const [row] = await queryLogsWithMedia({ where: eq(logs.id, logId), limit: 1, withUsername: true });
	if (!row) throw error(404, "Log not found");
	if (row.mediaSlug !== slug) throw error(404, "Log not found");

	if (row.userId === viewerId) return row;
	if (!row.isPublic) throw error(404, "Log not found");

	const [author] = await db.select({ isPrivate: users.isPrivate }).from(users).where(eq(users.id, row.userId)).limit(1);

	if (author?.isPrivate) {
		const status = viewerId ? await getFollowStatus(viewerId, row.userId) : null;
		if (status !== "accepted") throw error(404, "Log not found");
	}

	return row;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const viewerId = locals.user?.id ?? null;
	const log = await requireViewableLog(params.logId, params.slug, viewerId);

	const isOwner = viewerId === log.userId;

	const [comments, reactions, commentDenial, policyRow] = await Promise.all([
		getCommentThread(log.id),
		getReactions(log.id, viewerId),
		canComment(log.id, viewerId),
		// Not part of logCardSelect — only this page needs it, and adding it
		// there would ripple into every feed and profile query.
		isOwner
			? db.select({ commentPolicy: logs.commentPolicy }).from(logs).where(eq(logs.id, log.id)).limit(1)
			: Promise.resolve([]),
	]);

	return {
		log,
		comments,
		reactions,
		commentDenial,
		viewerId,
		isOwner,
		commentPolicy: policyRow[0]?.commentPolicy ?? null,
	};
};

export const actions: Actions = {
	comment: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const body = String(form.get("body") ?? "");
		const parentCommentId = form.get("parentCommentId") ? String(form.get("parentCommentId")) : null;

		const log = await requireViewableLog(event.params.logId, event.params.slug, user.id);

		const denial = await canComment(log.id, user.id);
		if (denial) return fail(403, { error: "Comments are closed on this log" });

		let parentAuthorId: string | null = null;
		try {
			({ parentAuthorId } = await addComment({ logId: log.id, userId: user.id, body, parentCommentId }));
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : "Could not post comment" });
		}

		// Always tell the log's author. createNotification no-ops when the
		// actor is the recipient, so commenting on your own log stays quiet.
		await createNotification(log.userId, user.id, parentCommentId ? "log_reply" : "log_comment", log.id);

		// And tell whoever was replied to, unless that's the log author
		// (already notified above).
		if (parentAuthorId && parentAuthorId !== log.userId) {
			await createNotification(parentAuthorId, user.id, "log_reply", log.id);
		}

		return { success: true };
	},

	editComment: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const commentId = String(form.get("commentId") ?? "");
		const body = String(form.get("body") ?? "");
		if (!commentId) return fail(400, { error: "Missing commentId" });

		try {
			await editComment(commentId, user.id, body);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : "Could not edit comment" });
		}
		return { success: true };
	},

	deleteComment: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const commentId = String(form.get("commentId") ?? "");
		if (!commentId) return fail(400, { error: "Missing commentId" });

		try {
			await deleteComment(commentId, user.id);
		} catch (err) {
			return fail(403, { error: err instanceof Error ? err.message : "Could not delete comment" });
		}
		return { success: true };
	},

	react: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const emoji = String(form.get("emoji") ?? "");

		const log = await requireViewableLog(event.params.logId, event.params.slug, user.id);

		try {
			const added = await toggleReaction(log.id, user.id, emoji);
			// Only notify on add — a toggle-off shouldn't ping anyone, and the
			// dedupe means re-adding just bumps the existing notification.
			if (added) await createNotification(log.userId, user.id, "log_reaction", log.id);
		} catch (err) {
			return fail(400, { error: err instanceof Error ? err.message : "Could not react" });
		}

		return { success: true };
	},

	setCommentPolicy: async (event) => {
		const user = requireUser(event);
		const form = await event.request.formData();
		const policy = String(form.get("commentPolicy") ?? "");
		if (!isCommentPolicy(policy)) {
			return fail(400, { error: "Invalid comment policy" });
		}

		const [log] = await db
			.select({ id: logs.id, userId: logs.userId })
			.from(logs)
			.where(eq(logs.id, event.params.logId))
			.limit(1);

		if (!log) throw error(404, "Log not found");
		if (log.userId !== user.id) throw error(403, "Not your log");

		await db.update(logs).set({ commentPolicy: policy }).where(eq(logs.id, log.id));

		return { success: true };
	},
};
