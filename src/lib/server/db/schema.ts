import {
    pgTable,
    uuid,
    text,
    timestamp,
    integer,
    pgEnum,
    jsonb,
    primaryKey,
    serial,
} from "drizzle-orm/pg-core";

export const task = pgTable("task", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    priority: integer("priority").notNull().default(1),
});

export const mediaTypeEnum = pgEnum("media_type", [
    "movie",
    "tv",
    "book",
    "manga",
    "anime",
    "comic",
    "game",
    "music",
]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const media = pgTable("media", {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    externalSource: text("external_source").notNull(), // 'tmdb', 'igdb'
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    releaseDate: timestamp("release_date"),
    coverUrl: text("cover_url"),
    metadata: jsonb("metadata"),
    lastFetchedAt: timestamp("last_fetched_at").defaultNow(),
});

export const entries = pgTable("entries", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
        .notNull()
        .references(() => media.id),
    rating: integer("rating"), // 1-10 or 1-100, your call
    review: text("review"),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = pgTable(
    "follows",
    {
        followerId: uuid("follower_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        followingId: uuid("following_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.followerId, t.followingId] }),
    }),
);
