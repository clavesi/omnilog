import { relations } from "drizzle-orm";
import {
	integer,
	pgEnum,
	pgSchema,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["github", "google"]);

export const UserTable = pgTable("user", {
	id: text("id").primaryKey().unique(),
	provider: providerEnum("provider").notNull(),
	providerId: integer("provider_id").notNull(),
	displayName: text("name").notNull(),
	username: text("username").notNull().unique(),
	email: text("email").notNull().unique(),
	imageUrl: text("image_url")
});

export const SessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => UserTable.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull()
});

// ===== MEDIA =====

export const mediaSchema = pgSchema("media_schema");

export const stageEnum = mediaSchema.enum("stage", [
	"completed",
	"in_progress",
	"planned",
	"abandoned"
]);

export const UserMediaTable = mediaSchema.table(
	"user_media",
	{
		userId: text("user_id")
			.notNull()
			.references(() => UserTable.id),
		mediaId: integer("media_id")
			.notNull()
			.references(() => MediaTable.id),
		stage: stageEnum("stage").notNull()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.userId, table.mediaId] })
		};
	}
);

export const MediaTable = mediaSchema.table("media", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	date_of_publication: integer("date_of_publication").notNull(),
	imageUrl: text("image_url").notNull()
});

export const mediaRelations = relations(MediaTable, ({ many }) => ({
	mediaToGenres: many(GenreTable)
}));

export const GenreTable = mediaSchema.table("genre", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique()
});

export const genreRelations = relations(GenreTable, ({ many }) => ({
	mediaToGenres: many(MediaTable)
}));

export const mediaToGenres = mediaSchema.table(
	"media_to_genres",
	{
		mediaId: integer("media_id")
			.notNull()
			.references(() => MediaTable.id),
		genreId: integer("genre_id")
			.notNull()
			.references(() => GenreTable.id)
	},
	(table) => ({
		pk: primaryKey({ columns: [table.mediaId, table.genreId] })
	})
);

export const MovieTable = mediaSchema.table("movie", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	director: text("director").notNull(),
	studio: text("studio").notNull(),
	duration: integer("duration").notNull()
});

export const TVShowTable = mediaSchema.table("tv_show", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	creator: text("creator").notNull(),
	network: text("network").notNull(),
	seasons: integer("seasons").notNull(),
	episodes: integer("episodes").notNull()
});

export const BookTable = mediaSchema.table("book", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	author: text("author").notNull(),
	publisher: text("publisher").notNull(),
	pages: integer("pages").notNull()
});

export const MangaTable = mediaSchema.table("manga", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	author: text("author").notNull(),
	artist: text("artist").notNull(),
	chapters: integer("chapters").notNull()
});

export const AnimeTable = mediaSchema.table("anime", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	studio: text("studio").notNull(),
	seasons: integer("seasons").notNull(),
	episodes: integer("episodes").notNull()
});

export const VideoGameTable = mediaSchema.table("video_game", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	developer: text("developer").notNull(),
	publisher: text("publisher").notNull(),
	platforms: text("platforms").notNull()
});
