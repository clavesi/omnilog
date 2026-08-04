import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { type FollowStatus, getFollowCounts, getFollowStatus } from "./follows";

export type ProfileUser = {
	id: string;
	username: string;
	imageURL: string | null;
	bio: string | null;
	isPrivate: boolean;
};

export type ProfileContext = {
	profileUser: ProfileUser;
	isOwnProfile: boolean;
	followStatus: FollowStatus | null;
	followCounts: { followers: number; following: number };
	/**
	 * Whether the viewer may see anything beyond the header — logs, lists,
	 * showcase, and the follower/following graph all sit behind this.
	 */
	canSeeContent: boolean;
};

/**
 * Resolves a profile by username along with the viewer's relationship to it.
 * Shared by the profile page and its followers/following subpages so the
 * privacy rule lives in exactly one place.
 *
 * Throws 404 if no such user.
 */
export async function getProfileContext(username: string, viewerId: string | null): Promise<ProfileContext> {
	const [profileUser] = await db
		.select({
			id: users.id,
			username: users.username,
			imageURL: users.image,
			bio: users.bio,
			isPrivate: users.isPrivate,
		})
		.from(users)
		.where(eq(users.username, username))
		.limit(1);

	if (!profileUser) throw error(404, "User not found");

	const isOwnProfile = viewerId === profileUser.id;

	const [followCounts, followStatus] = await Promise.all([
		getFollowCounts(profileUser.id),
		viewerId && !isOwnProfile ? getFollowStatus(viewerId, profileUser.id) : Promise.resolve(null),
	]);

	const canSeeContent = isOwnProfile || !profileUser.isPrivate || followStatus === "accepted";

	return { profileUser, isOwnProfile, followStatus, followCounts, canSeeContent };
}
