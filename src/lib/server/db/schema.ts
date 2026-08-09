import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export * from "../../media-types";

import { EMPTY_METADATA, type MediaMetadata } from "../../media-types";

// ============================================================================
// ENUMS
// ============================================================================
export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv", "book", "game", "music", "anime", "manga", "comic"]);

export const partTypeEnum = pgEnum("part_type", [
	"season",
	"episode",
	"chapter",
	"volume",
	"arc",
	"saga",
	"track",
	"dlc",
	"expansion",
]);

export const mediaStatusEnum = pgEnum("media_status", ["planned", "in_progress", "completed", "dropped", "on_hold"]);

// "owner" is a single, fixed role set directly via SQL — there's no UI
// to grant it, matching how the first admin used to be bootstrapped.
// Only the owner can promote/demote admins; regular admins have no
// role-management power at all (they just do the arc/saga management
// admin was originally created for).
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "owner"]);
export const followStatusEnum = pgEnum("follow_status", ["pending", "accepted"]);
export const notificationTypeEnum = pgEnum("notification_type", [
	"follow",
	"follow_request",
	"follow_accepted",
	"log_comment",
	"log_reply",
	"log_reaction",
]);

/** Who the log's author allows to comment on it. */
export const commentPolicyEnum = pgEnum("comment_policy", ["everyone", "followers", "nobody"]);

export const externalSourceEnum = pgEnum("external_source", [
	"tmdb",
	"openlibrary",
	"google_books",
	"igdb",
	"anilist",
	"mal",
	"musicbrainz",
]);

// ============================================================================
// USERS & AUTH
// ============================================================================
export const users = pgTable(
	"users",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		emailVerified: boolean("email_verified").notNull().default(false),
		// Better Auth's core user model requires a "name" field. This app has
		// no separate real-name concept — it's set equal to username at
		// signup and never shown anywhere; `username` remains the actual
		// public handle used everywhere in the UI and in profile URLs.
		name: text("name").notNull(),
		username: text("username").notNull(),
		displayUsername: text("display_username"),
		image: text("image"),
		bio: text("bio"),
		// Only the owner can change this via the admin UI
		role: userRoleEnum("role").notNull().default("user"),
		// Email/password signups pick their own username immediately, so this starts true for them.
		// OAuth signups get a derived placeholder username and this starts false,
		// 	 gating them through a one-time "confirm your username" step — see /confirm-username.
		usernameConfirmed: boolean("username_confirmed").notNull().default(true),
		// When true, follow requests must be approved before the follower can see this account's logs in their feed
		isPrivate: boolean("is_private").notNull().default(false),
		// Copied onto each new log at creation time rather than read live, so
		// changing it later doesn't retroactively reopen or close old threads.
		defaultCommentPolicy: commentPolicyEnum("default_comment_policy").notNull().default("everyone"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [uniqueIndex("users_username_unique").on(t.username), uniqueIndex("users_email_unique").on(t.email)],
);

// ============================================================================
// BETTER AUTH TABLES
// Replaces the old hand-rolled `sessions` table and the separate
// `password_reset_tokens` table — Better Auth's `session`/`account`/
// `verification` tables subsume both roles. `account` also stores OAuth
// provider identities once GitHub/Google are added (Stage 4), which is why
// it's provider-agnostic rather than password-specific.
// ============================================================================
export const session = pgTable("session", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	// "credential" for email/password; "github" / "google" once OAuth is added.
	providerId: text("provider_id").notNull(),
	// The provider's own account identifier — for "credential" this is just
	// the user's id; for OAuth providers this is their subject/user id.
	accountId: text("account_id").notNull(),
	password: text("password"), // only populated for providerId: "credential"
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
	scope: text("scope"),
	idToken: text("id_token"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// MEDIA CATALOG
// ============================================================================
export const mediaItems = pgTable(
	"media_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		slug: text("slug").notNull(),

		mediaType: mediaTypeEnum("media_type").notNull(),
		title: text("title").notNull(),
		originalTitle: text("original_title"),
		description: text("description"),
		releaseDate: date("release_date", { mode: "string" }),
		coverImageUrl: text("cover_image_url"),
		backdropImageUrl: text("backdrop_image_url"),

		// Cached aggregate for fast sorting/display.
		// Recalculate on log insert/update/delete when rating is not null.
		averageRating: numeric("average_rating", { precision: 3, scale: 1 }),
		ratingCount: integer("rating_count").notNull().default(0),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		uniqueIndex("media_items_slug_unique").on(t.slug),
		index("media_items_type_idx").on(t.mediaType),
		index("media_items_title_idx").on(t.title),
		index("media_items_release_date_idx").on(t.releaseDate),
	],
);

export const mediaExternalIds = pgTable(
	"media_external_ids",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		mediaItemId: uuid("media_item_id")
			.notNull()
			.references(() => mediaItems.id, { onDelete: "cascade" }),
		source: externalSourceEnum("source").notNull(),
		externalId: text("external_id").notNull(),
		url: text("url"),

		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex("media_external_ids_source_external_unique").on(t.source, t.externalId),
		index("media_external_ids_media_item_idx").on(t.mediaItemId),
	],
);

export const mediaMetadata = pgTable("media_metadata", {
	mediaItemId: uuid("media_item_id")
		.primaryKey()
		.references(() => mediaItems.id, { onDelete: "cascade" }),
	metadata: jsonb("metadata").$type<MediaMetadata>().notNull().default(EMPTY_METADATA),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const genres = pgTable(
	"genres",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
	},
	(table) => [uniqueIndex("genres_slug_unique").on(table.slug)],
);

export const mediaGenres = pgTable(
	"media_genres",
	{
		mediaItemId: uuid("media_item_id")
			.notNull()
			.references(() => mediaItems.id, { onDelete: "cascade" }),
		genreId: uuid("genre_id")
			.notNull()
			.references(() => genres.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("media_genres_pk").on(t.mediaItemId, t.genreId),
		index("media_genres_media_item_id_idx").on(t.mediaItemId),
		index("media_genres_genre_id_idx").on(t.genreId),
	],
);

// ============================================================================
// MEDIA PARTS
// ============================================================================
export const mediaParts = pgTable(
	"media_parts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		mediaItemId: uuid("media_item_id")
			.notNull()
			.references(() => mediaItems.id, { onDelete: "cascade" }),

		parentPartId: uuid("parent_part_id").references((): AnyPgColumn => mediaParts.id, { onDelete: "cascade" }),
		partType: partTypeEnum("part_type").notNull(),
		partNumber: integer("number"),

		title: text("title"),
		releaseDate: date("release_date", { mode: "string" }),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

		// Cached aggregate, same convention as media_items.averageRating —
		// recomputed by recomputePartAggregate() in media-aggregate.ts on
		// every insert/update/delete of a log targeting this part.
		averageRating: numeric("average_rating", { precision: 3, scale: 1 }),
		ratingCount: integer("rating_count").notNull().default(0),

		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("media_parts_parent_part_id_idx").on(t.parentPartId),
		index("media_parts_media_item_idx").on(t.mediaItemId),
		index("media_parts_part_type_idx").on(t.partType),
	],
);

// ============================================================================
// LOGS
// A log is a single "I experienced this" entry. It can carry a rating, a
// review, both, or neither (just a date). Users can have many logs per item
// to represent rewatches/rereads.
//
// The two-nullable-FK pattern (media_item_id XOR media_part_id) lets a log
// target either a whole item or a specific part (episode, chapter, etc.).
// ============================================================================
export const logs = pgTable(
	"logs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		mediaItemId: uuid("media_item_id").references(() => mediaItems.id, { onDelete: "cascade" }),
		mediaPartId: uuid("media_part_id").references(() => mediaParts.id, { onDelete: "cascade" }),

		// The date the user says they experienced the media. Nullable for
		// "I've seen this but don't remember when".
		loggedAt: date("logged_at", { mode: "string" }),

		// 1-10 (half-star scale). Nullable: a log without a rating is fine.
		rating: smallint("rating"),

		// Review fields. Body is the required piece if there's a review at all;
		// title and spoiler flag are optional annotations on top of the body.
		reviewTitle: text("review_title"),
		reviewBody: text("review_body"),
		containsSpoilers: boolean("contains_spoilers").notNull().default(false),

		// Denormalized on insert: 1 = first log for this target, 2+ = rewatch.
		watchNumber: smallint("watch_number").notNull().default(1),
		// True when watchNumber > 1. Kept for simple queries; the label uses watchNumber.
		isRewatch: boolean("is_rewatch").notNull().default(false),
		// True if this log is visible to everyone, not just the user.
		isPublic: boolean("is_public").notNull().default(true),
		// Set from the author's preference at insert time; editable per log.
		commentPolicy: commentPolicyEnum("comment_policy").notNull().default("everyone"),

		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		// Exactly one target must be set.
		check(
			"logs_target_check",
			sql`(${t.mediaItemId} IS NOT NULL AND ${t.mediaPartId} IS NULL) OR (${t.mediaItemId} IS NULL AND ${t.mediaPartId} IS NOT NULL)`,
		),
		// Rating is optional, but if set must be in range.
		check("logs_rating_range", sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 10`),
		check("logs_watch_number_min", sql`${t.watchNumber} >= 1`),
		// Log date can't be in the future.
		check("logs_logged_at_not_future", sql`${t.loggedAt} IS NULL OR ${t.loggedAt} <= CURRENT_DATE`),
		index("logs_user_idx").on(t.userId),
		index("logs_media_item_idx").on(t.mediaItemId),
		index("logs_media_part_idx").on(t.mediaPartId),
		index("logs_logged_at_idx").on(t.loggedAt),
		index("logs_created_at_idx").on(t.createdAt),
		// Common lookup: "show me user's logs for this item, newest first"
		index("logs_user_item_idx").on(t.userId, t.mediaItemId),
		index("logs_user_part_idx").on(t.userId, t.mediaPartId),
		index("logs_public_created_at_idx").on(t.isPublic, t.createdAt),
	],
);

// ============================================================================
// USER STATUS ("watching", "completed", etc.)
// Separate from logs — status is the user's current state, logs are history.
// ============================================================================
export const userMediaStatus = pgTable(
	"user_media_status",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		mediaItemId: uuid("media_item_id")
			.notNull()
			.references(() => mediaItems.id, { onDelete: "cascade" }),

		status: mediaStatusEnum("status").notNull(),
		progress: integer("progress"),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),

		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("user_media_statuses_user_id_idx").on(t.userId),
		uniqueIndex("user_media_status_user_media_unique").on(t.userId, t.mediaItemId),
		index("user_media_status_user_status_idx").on(t.userId, t.status),
	],
);

// ============================================================================
// FAVORITES
// One favorite per user per media type — enforced by the unique index below.
// ============================================================================
export const favorites = pgTable(
	"favorites",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		mediaType: mediaTypeEnum("media_type").notNull(),
		mediaItemId: uuid("media_item_id")
			.notNull()
			.references(() => mediaItems.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex("favorites_user_media_type_unique").on(t.userId, t.mediaType),
		index("favorites_user_idx").on(t.userId),
		index("favorites_media_item_idx").on(t.mediaItemId),
	],
);

// ============================================================================
// USER-CURATED LISTS
// A titled, ordered collection of media_items — can mix any media type.
// Position is a plain integer for ordering; reordering just swaps/shifts position values.
// ============================================================================
export const lists = pgTable(
	"lists",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description"),
		isPublic: boolean("is_public").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("lists_user_idx").on(t.userId)],
);

export const listItems = pgTable(
	"list_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		listId: uuid("list_id")
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		mediaItemId: uuid("media_item_id")
			.notNull()
			.references(() => mediaItems.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		note: text("note"), // optional per-item blurb, e.g. why it's on the list
		addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex("list_items_list_media_unique").on(t.listId, t.mediaItemId), // no duplicate entries in one list
		index("list_items_list_idx").on(t.listId),
		index("list_items_media_item_idx").on(t.mediaItemId),
	],
);

// ============================================================================
// FOLLOWS
// A directed follow graph.
// - status = "pending" while waiting for approval on a private account;
// - status = "accepted" once approved (or immediately for public accounts).
// ============================================================================
export const follows = pgTable(
	"follows",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		followerId: text("follower_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		followingId: text("following_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: followStatusEnum("status").notNull().default("accepted"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		// The unique constraint prevents duplicate requests.
		uniqueIndex("follows_follower_following_unique").on(t.followerId, t.followingId),
		index("follows_follower_idx").on(t.followerId),
		index("follows_following_idx").on(t.followingId),
	],
);

// ============================================================================
// TAGS
// ============================================================================

/**
 * Global tag vocabulary, deduplicated by slug.
 *
 * Shared rather than per-user so "comfort watch" is one row however many people use it.
 * That keeps autocomplete cheap and means a rename or merge later touches one row.
 * Ownership lives on log_tags via the log's author, which is what per-user browsing keys on.
 */
export const tags = pgTable(
	"tags",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		// Display form, as first written. Slug is what's compared.
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [uniqueIndex("tags_slug_unique").on(t.slug)],
);

export const logTags = pgTable(
	"log_tags",
	{
		logId: uuid("log_id")
			.notNull()
			.references(() => logs.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(t) => [
		uniqueIndex("log_tags_pk").on(t.logId, t.tagId),
		index("log_tags_log_idx").on(t.logId),
		index("log_tags_tag_idx").on(t.tagId),
	],
);

// ============================================================================
// LOG SOCIAL: COMMENTS + REACTIONS
// ============================================================================

/**
 * Comments on a log, one level of nesting.
 *
 * `parentCommentId` points at a top-level comment; replies to replies are
 * flattened in the service layer rather than blocked by a constraint, since
 * Postgres can't express "parent must itself have a null parent" without a
 * trigger.
 *
 * Deletes are hard, and the self-referencing FK cascades — removing a
 * top-level comment removes its replies with it.
 */
export const logComments = pgTable(
	"log_comments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		logId: uuid("log_id")
			.notNull()
			.references(() => logs.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		parentCommentId: uuid("parent_comment_id").references((): AnyPgColumn => logComments.id, {
			onDelete: "cascade",
		}),

		body: text("body").notNull(),

		editedAt: timestamp("edited_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("log_comments_log_idx").on(t.logId, t.createdAt),
		index("log_comments_parent_idx").on(t.parentCommentId),
		index("log_comments_user_idx").on(t.userId),
	],
);

/**
 * Emoji reactions on a log. One row per (log, user): picking a different
 * emoji replaces the existing reaction rather than adding a second.
 *
 * The emoji is stored as text rather than an enum — the allowed set lives in
 * $lib/reactions and is validated on write. Changing that set shouldn't
 * require a migration.
 */
export const logReactions = pgTable(
	"log_reactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		logId: uuid("log_id")
			.notNull()
			.references(() => logs.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		emoji: text("emoji").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex("log_reactions_log_user_unique").on(t.logId, t.userId),
		index("log_reactions_log_idx").on(t.logId),
	],
);

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		actorId: text("actor_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		// What the notification is about — a log id for comment/reaction
		// types. Empty string for follow types, which have no target beyond
		// the actor. Deliberately not null: Postgres treats NULLs as distinct
		// in unique indexes, which would silently break the dedupe below.
		targetId: text("target_id").notNull().default(""),
		read: boolean("read").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		// One notification per (recipient, actor, type). Re-triggering the same
		// event bumps the existing row instead of creating a duplicate.
		uniqueIndex("notifications_user_actor_type_target_unique").on(t.userId, t.actorId, t.type, t.targetId),
		index("notifications_user_id_idx").on(t.userId),
		index("notifications_user_read_idx").on(t.userId, t.read),
	],
);

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	logs: many(logs),
	statuses: many(userMediaStatus),
	favorites: many(favorites),
	lists: many(lists),
	following: many(follows, { relationName: "follower" }),
	followers: many(follows, { relationName: "following" }),
	notifications: many(notifications, { relationName: "recipient" }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
	follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
	following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	logs: many(logTags),
}));

export const logTagsRelations = relations(logTags, ({ one }) => ({
	log: one(logs, { fields: [logTags.logId], references: [logs.id] }),
	tag: one(tags, { fields: [logTags.tagId], references: [tags.id] }),
}));

export const logCommentsRelations = relations(logComments, ({ one, many }) => ({
	log: one(logs, { fields: [logComments.logId], references: [logs.id] }),
	author: one(users, { fields: [logComments.userId], references: [users.id] }),
	parent: one(logComments, {
		fields: [logComments.parentCommentId],
		references: [logComments.id],
		relationName: "parent_comment",
	}),
	replies: many(logComments, { relationName: "parent_comment" }),
}));

export const logReactionsRelations = relations(logReactions, ({ one }) => ({
	log: one(logs, { fields: [logReactions.logId], references: [logs.id] }),
	user: one(users, { fields: [logReactions.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, { fields: [notifications.userId], references: [users.id], relationName: "recipient" }),
	actor: one(users, { fields: [notifications.actorId], references: [users.id], relationName: "actor" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(users, {
		fields: [session.userId],
		references: [users.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id],
	}),
}));

export const mediaItemsRelations = relations(mediaItems, ({ many, one }) => ({
	externalIds: many(mediaExternalIds),
	metadata: one(mediaMetadata, {
		fields: [mediaItems.id],
		references: [mediaMetadata.mediaItemId],
	}),
	genres: many(mediaGenres),
	parts: many(mediaParts),
	logs: many(logs),
	statuses: many(userMediaStatus),
	favorites: many(favorites),
	listItems: many(listItems),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
	user: one(users, { fields: [lists.userId], references: [users.id] }),
	items: many(listItems),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
	list: one(lists, { fields: [listItems.listId], references: [lists.id] }),
	mediaItem: one(mediaItems, { fields: [listItems.mediaItemId], references: [mediaItems.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
	user: one(users, { fields: [favorites.userId], references: [users.id] }),
	mediaItem: one(mediaItems, { fields: [favorites.mediaItemId], references: [mediaItems.id] }),
}));

export const mediaExternalIdsRelations = relations(mediaExternalIds, ({ one }) => ({
	mediaItem: one(mediaItems, {
		fields: [mediaExternalIds.mediaItemId],
		references: [mediaItems.id],
	}),
}));

export const mediaMetadataRelations = relations(mediaMetadata, ({ one }) => ({
	mediaItem: one(mediaItems, {
		fields: [mediaMetadata.mediaItemId],
		references: [mediaItems.id],
	}),
}));

export const genresRelations = relations(genres, ({ many }) => ({
	mediaGenres: many(mediaGenres),
}));

export const mediaGenresRelations = relations(mediaGenres, ({ one }) => ({
	mediaItem: one(mediaItems, {
		fields: [mediaGenres.mediaItemId],
		references: [mediaItems.id],
	}),
	genre: one(genres, {
		fields: [mediaGenres.genreId],
		references: [genres.id],
	}),
}));

export const mediaPartsRelations = relations(mediaParts, ({ one, many }) => ({
	mediaItem: one(mediaItems, {
		fields: [mediaParts.mediaItemId],
		references: [mediaItems.id],
	}),
	parentPart: one(mediaParts, {
		fields: [mediaParts.parentPartId],
		references: [mediaParts.id],
		relationName: "parent_part",
	}),
	childParts: many(mediaParts, {
		relationName: "parent_part",
	}),
	logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one, many }) => ({
	user: one(users, { fields: [logs.userId], references: [users.id] }),
	mediaItem: one(mediaItems, {
		fields: [logs.mediaItemId],
		references: [mediaItems.id],
	}),
	mediaPart: one(mediaParts, {
		fields: [logs.mediaPartId],
		references: [mediaParts.id],
	}),
	comments: many(logComments),
	reactions: many(logReactions),
	tags: many(logTags),
}));

export const userMediaStatusRelations = relations(userMediaStatus, ({ one }) => ({
	user: one(users, {
		fields: [userMediaStatus.userId],
		references: [users.id],
	}),
	mediaItem: one(mediaItems, {
		fields: [userMediaStatus.mediaItemId],
		references: [mediaItems.id],
	}),
}));
