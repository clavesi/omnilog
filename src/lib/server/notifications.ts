import { and, count, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "./db";
import { follows, logs, mediaItems, notifications, users } from "./db/schema";

export type NotificationType =
	| "follow"
	| "follow_request"
	| "follow_accepted"
	| "log_comment"
	| "log_reply"
	| "log_reaction";

/** Types whose `targetId` is a log id, and which therefore link to a log. */
const LOG_TARGET_TYPES = new Set<NotificationType>(["log_comment", "log_reply", "log_reaction"]);

export type NotificationRow = {
	id: string;
	type: NotificationType;
	read: boolean;
	createdAt: Date;
	actor: { id: string; username: string; image: string | null };
	/** Only meaningful for `follow_request` — false once accepted or declined. */
	isPending: boolean;
	/**
	 * Where clicking the notification should go. Null for follow types,
	 * which link to the actor's profile instead.
	 */
	logHref: string | null;
};

/**
 * Create a notification, or bump the existing one if the same
 * (recipient, actor, type, target) already exists. Bumping resets it to
 * unread and refreshes the timestamp so it resurfaces rather than
 * duplicating.
 *
 * `targetId` is what keeps comment and reaction notifications separate per
 * log — without it, someone commenting on two of your logs would collapse
 * into a single notification. Follow types pass the empty-string default,
 * since the actor is the whole story.
 */
export async function createNotification(
	userId: string,
	actorId: string,
	type: NotificationType,
	targetId = "",
): Promise<void> {
	if (userId === actorId) return;
	await db
		.insert(notifications)
		.values({ userId, actorId, type, targetId })
		.onConflictDoUpdate({
			target: [notifications.userId, notifications.actorId, notifications.type, notifications.targetId],
			set: { read: false, createdAt: new Date() },
		});
}

/** Unread count for the nav badge. */
export async function getUnreadCount(userId: string): Promise<number> {
	const [row] = await db
		.select({ count: count() })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
	return row?.count ?? 0;
}

/**
 * All notifications for a user, newest first, with actor info.
 * `follow_request` rows carry the live pending state so the UI knows whether
 * to still offer accept/decline.
 */
export async function getNotifications(userId: string, opts: { limit?: number } = {}): Promise<NotificationRow[]> {
	const limit = opts.limit ?? 50;

	const rows = await db
		.select({
			id: notifications.id,
			type: notifications.type,
			read: notifications.read,
			createdAt: notifications.createdAt,
			actorId: users.id,
			actorUsername: users.username,
			actorImage: users.image,
			followStatus: follows.status,
			targetLogId: logs.id,
			targetMediaSlug: mediaItems.slug,
		})
		.from(notifications)
		.innerJoin(users, eq(notifications.actorId, users.id))
		// Left join the follow row the actor created, so a declined (deleted)
		// request yields null and renders as resolved.
		.leftJoin(
			follows,
			and(eq(follows.followerId, notifications.actorId), eq(follows.followingId, notifications.userId)),
		)
		// Resolve comment/reaction targets to a linkable log.
		// Left-joined so a deleted log leaves the notification renderable, just unlinked.
		// targetId is text (it holds "" for follow types), so the uuid side is cast rather than the reverse.
		// A non-uuid targetId would otherwise error rather than simply not matching.
		.leftJoin(logs, sql`${logs.id}::text = ${notifications.targetId}`)
		.leftJoin(mediaItems, eq(mediaItems.id, logs.mediaItemId))
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))
		.limit(limit);

	return rows.map((r) => ({
		id: r.id,
		type: r.type as NotificationType,
		read: r.read,
		createdAt: r.createdAt,
		actor: { id: r.actorId, username: r.actorUsername, image: r.actorImage },
		isPending: r.type === "follow_request" && r.followStatus === "pending",
		logHref:
			LOG_TARGET_TYPES.has(r.type as NotificationType) && r.targetLogId && r.targetMediaSlug
				? `/media/${r.targetMediaSlug}/log/${r.targetLogId}`
				: null,
	}));
}

/**
 * Resolve a follow request notification once it's been accepted or declined.
 * Accepting rewrites it as a plain `follow` so the recipient keeps the record;
 * declining removes it entirely.
 */
export async function resolveFollowRequestNotification(
	userId: string,
	actorId: string,
	outcome: "accepted" | "declined",
): Promise<void> {
	if (outcome === "declined") {
		await db
			.delete(notifications)
			.where(
				and(
					eq(notifications.userId, userId),
					eq(notifications.actorId, actorId),
					eq(notifications.type, "follow_request"),
				),
			);
		return;
	}

	// Accepted: drop any stale `follow` row first so the type rewrite below
	// can't collide with the (user, actor, type) unique index.
	await db
		.delete(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.actorId, actorId), eq(notifications.type, "follow")));

	await db
		.update(notifications)
		.set({ type: "follow", read: true })
		.where(
			and(
				eq(notifications.userId, userId),
				eq(notifications.actorId, actorId),
				eq(notifications.type, "follow_request"),
			),
		);
}

/**
 * Mark everything read except follow requests that are still awaiting a
 * decision. Called when the notifications page is opened: informational rows
 * are considered seen on sight, actionable ones stay lit until resolved.
 */
export async function markNonActionableAsRead(userId: string): Promise<void> {
	await db
		.update(notifications)
		.set({ read: true })
		.where(
			and(
				eq(notifications.userId, userId),
				eq(notifications.read, false),
				or(
					ne(notifications.type, "follow_request"),
					// A request with no live pending row was already accepted or
					// declined, so it's informational now too.
					sql`not exists (
						select 1 from ${follows}
						where ${follows.followerId} = ${notifications.actorId}
						  and ${follows.followingId} = ${notifications.userId}
						  and ${follows.status} = 'pending'
					)`,
				),
			),
		);
}
