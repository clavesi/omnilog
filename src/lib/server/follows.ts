import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { follows, users } from "./db/schema";

export type FollowStatus = "accepted" | "pending" | "not_following";

/** The current follow relationship from viewer -> target. */
export async function getFollowStatus(followerId: string, followingId: string): Promise<FollowStatus> {
	const [row] = await db
		.select({ status: follows.status })
		.from(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
		.limit(1);
	if (!row) return "not_following";
	return row.status;
}

/** Follower/following counts for a user's profile header. */
export async function getFollowCounts(userId: string) {
	const [{ followers }] = await db
		.select({ followers: sql<number>`count(*)::int` })
		.from(follows)
		.where(and(eq(follows.followingId, userId), eq(follows.status, "accepted")));
	const [{ following }] = await db
		.select({ following: sql<number>`count(*)::int` })
		.from(follows)
		.where(and(eq(follows.followerId, userId), eq(follows.status, "accepted")));
	return { followers, following };
}

export type FollowUser = { id: string; username: string; image: string | null };

export async function getFollowers(userId: string): Promise<FollowUser[]> {
	return db
		.select({ id: users.id, username: users.username, image: users.image })
		.from(follows)
		.innerJoin(users, eq(follows.followerId, users.id))
		.where(and(eq(follows.followingId, userId), eq(follows.status, "accepted")));
}

export async function getFollowing(userId: string): Promise<FollowUser[]> {
	return db
		.select({ id: users.id, username: users.username, image: users.image })
		.from(follows)
		.innerJoin(users, eq(follows.followingId, users.id))
		.where(and(eq(follows.followerId, userId), eq(follows.status, "accepted")));
}

/** Pending incoming follow requests — only the target user sees these. */
export async function getPendingRequests(userId: string): Promise<FollowUser[]> {
	return db
		.select({ id: users.id, username: users.username, image: users.image })
		.from(follows)
		.innerJoin(users, eq(follows.followerId, users.id))
		.where(and(eq(follows.followingId, userId), eq(follows.status, "pending")));
}

/**
 * Sends a follow request or immediately follows, depending on whether
 * the target account is private. Returns the resulting status.
 */
export async function follow(followerId: string, followingId: string): Promise<FollowStatus> {
	const [target] = await db
		.select({ isPrivate: users.isPrivate })
		.from(users)
		.where(eq(users.id, followingId))
		.limit(1);

	if (!target) throw new Error("User not found");
	if (followerId === followingId) throw new Error("Cannot follow yourself");

	const status = target.isPrivate ? "pending" : "accepted";

	await db.insert(follows).values({ followerId, followingId, status }).onConflictDoNothing();

	return status;
}

export async function unfollow(followerId: string, followingId: string): Promise<void> {
	await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

/** Accept a pending follow request — only the target can do this. */
export async function acceptFollowRequest(followingId: string, followerId: string): Promise<void> {
	await db
		.update(follows)
		.set({ status: "accepted", updatedAt: new Date() })
		.where(
			and(eq(follows.followerId, followerId), eq(follows.followingId, followingId), eq(follows.status, "pending")),
		);
}

/** Reject/delete a pending follow request — only the target can do this. */
export async function rejectFollowRequest(followingId: string, followerId: string): Promise<void> {
	await db
		.delete(follows)
		.where(
			and(eq(follows.followerId, followerId), eq(follows.followingId, followingId), eq(follows.status, "pending")),
		);
}
