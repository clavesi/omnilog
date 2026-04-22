import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	check,
	customType,
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
// TYPES
// ============================================================================
const bytea = customType<{ data: Uint8Array; default: false }>({
	dataType() {
		return "bytea";
	},
	toDriver(value: Uint8Array): Buffer {
		return Buffer.from(value);
	},
	fromDriver(value: unknown): Uint8Array {
		if (value instanceof Uint8Array) return value;
		if (Buffer.isBuffer(value)) return new Uint8Array(value);
		throw new Error("Expected bytea value from database");
	},
});

// ============================================================================
// ENUMS
// ============================================================================
export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv", "book", "game", "music", "anime", "manga", "comic"]);

export const partTypeEnum = pgEnum("part_type", ["season", "episode", "chapter", "volume", "arc", "track"]);

export const mediaStatusEnum = pgEnum("media_status", ["planned", "in_progress", "completed", "dropped", "on_hold"]);

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
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").notNull(),
		username: text("username").notNull(),
		passwordHash: text("password_hash").notNull(),
		avatarUrl: text("avatar_url"),
		bio: text("bio"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [uniqueIndex("users_username_unique").on(t.username), uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	secretHash: bytea("secret_hash").notNull(),
	lastVerifiedAt: timestamp("last_verified_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
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
		userId: uuid("user_id")
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

		// True if this is a rewatch/reread — i.e. the user has a prior log
		// for this target. Denormalized so the UI can cheaply show "1st watch"
		// vs "3rd watch". Set by app code on insert.
		isRewatch: boolean("is_rewatch").notNull().default(false),

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
		userId: uuid("user_id")
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
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	logs: many(logs),
	statuses: many(userMediaStatus),
}));

// export const sessionsRelations = relations(sessions, ({ one }) => ({
// 	user: one(users, {
// 		fields: [sessions.userId],
// 		references: [users.id],
// 	}),
// }));

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

export const logsRelations = relations(logs, ({ one }) => ({
	user: one(users, { fields: [logs.userId], references: [users.id] }),
	mediaItem: one(mediaItems, {
		fields: [logs.mediaItemId],
		references: [mediaItems.id],
	}),
	mediaPart: one(mediaParts, {
		fields: [logs.mediaPartId],
		references: [mediaParts.id],
	}),
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
