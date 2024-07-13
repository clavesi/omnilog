import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["github", "google"]);
export const stageEnum = pgEnum("stage", ["completed", "in_progress", "planned", "abandoned"]);

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

export const UserMediaTable = pgTable(
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

// TODO: add relations

export const MediaTable = pgTable("media", {
	id: serial("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	date_of_publication: integer("date_of_publication").notNull(),
	imageUrl: text("image_url").notNull()
});

export const GenreTable = pgTable("genre", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().unique()
});

export const MovieTable = pgTable("movie", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	director: text("director").notNull(),
	studio: text("studio").notNull(),
	duration: integer("duration").notNull()
});

export const MovieGenreTable = pgTable(
	"movie_genre",
	{
		movieId: integer("movie_id").references(() => MovieTable.id),
		genreId: integer("genre_id").references(() => GenreTable.id),
		primary_genre: boolean("primary_genre").notNull().default(false)
	},
	(table) => {
		return {
			// Composite primary key
			pk: primaryKey({ columns: [table.movieId, table.genreId] })
		};
	}
);

export const TVShowTable = pgTable("tv_show", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	creator: text("creator").notNull(),
	network: text("network").notNull(),
	seasons: integer("seasons").notNull(),
	episodes: integer("episodes").notNull()
});

export const TVShowGenreTable = pgTable(
	"tv_show_genre",
	{
		tvShowId: integer("tv_show_id").references(() => TVShowTable.id),
		genreId: integer("genre_id").references(() => GenreTable.id),
		primary_genre: boolean("primary_genre").notNull().default(false)
	},
	(table) => {
		return {
			// Composite primary key
			pk: primaryKey({ columns: [table.tvShowId, table.genreId] })
		};
	}
);

export const BookTable = pgTable("book", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	author: text("author").notNull(),
	publisher: text("publisher").notNull(),
	pages: integer("pages").notNull()
});

export const BookGenreTable = pgTable(
	"book_genre",
	{
		bookId: integer("book_id").references(() => BookTable.id),
		genreId: integer("genre_id").references(() => GenreTable.id),
		primary_genre: boolean("primary_genre").notNull().default(false)
	},
	(table) => {
		return {
			// Composite primary key
			pk: primaryKey({ columns: [table.bookId, table.genreId] })
		};
	}
);

export const MangaTable = pgTable("manga", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	author: text("author").notNull(),
	artist: text("artist").notNull(),
	chapters: integer("chapters").notNull()
});

export const MangaGenreTable = pgTable(
	"manga_genre",
	{
		mangaId: integer("manga_id").references(() => MangaTable.id),
		genreId: integer("genre_id").references(() => GenreTable.id),
		primary_genre: boolean("primary_genre").notNull().default(false)
	},
	(table) => {
		return {
			// Composite primary key
			pk: primaryKey({ columns: [table.mangaId, table.genreId] })
		};
	}
);

export const AnimeTable = pgTable("anime", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	studio: text("studio").notNull(),
	seasons: integer("seasons").notNull(),
	episodes: integer("episodes").notNull()
});

export const AnimeGenreTable = pgTable(
	"anime_genre",
	{
		animeId: integer("anime_id").references(() => AnimeTable.id),
		genreId: integer("genre_id").references(() => GenreTable.id),
		primary_genre: boolean("primary_genre").notNull().default(false)
	},
	(table) => {
		return {
			// Composite primary key
			pk: primaryKey({ columns: [table.animeId, table.genreId] })
		};
	}
);

export const VideoGameTable = pgTable("video_game", {
	id: serial("id").primaryKey(),
	mediaId: integer("media_id").references(() => MediaTable.id),
	developer: text("developer").notNull(),
	publisher: text("publisher").notNull(),
	platforms: text("platforms").notNull()
});

export const VideoGameGenreTable = pgTable(
	"video_game_genre",
	{
		videoGameId: integer("video_game_id").references(() => VideoGameTable.id),
		genreId: integer("genre_id").references(() => GenreTable.id),
		primary_genre: boolean("primary_genre").notNull().default(false)
	},
	(table) => {
		return {
			// Composite primary key
			pk: primaryKey({ columns: [table.videoGameId, table.genreId] })
		};
	}
);
