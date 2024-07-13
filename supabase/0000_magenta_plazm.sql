DO $$ BEGIN
 CREATE TYPE "public"."provider" AS ENUM('github', 'google');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."stage" AS ENUM('completed', 'in_progress', 'planned', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "anime_genre" (
	"anime_id" integer,
	"genre_id" integer,
	"primary_genre" boolean DEFAULT false NOT NULL,
	CONSTRAINT "anime_genre_anime_id_genre_id_pk" PRIMARY KEY("anime_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "anime" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"studio" text NOT NULL,
	"seasons" integer NOT NULL,
	"episodes" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_genre" (
	"book_id" integer,
	"genre_id" integer,
	"primary_genre" boolean DEFAULT false NOT NULL,
	CONSTRAINT "book_genre_book_id_genre_id_pk" PRIMARY KEY("book_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"author" text NOT NULL,
	"publisher" text NOT NULL,
	"pages" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "genre" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genre_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manga_genre" (
	"manga_id" integer,
	"genre_id" integer,
	"primary_genre" boolean DEFAULT false NOT NULL,
	CONSTRAINT "manga_genre_manga_id_genre_id_pk" PRIMARY KEY("manga_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manga" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"author" text NOT NULL,
	"artist" text NOT NULL,
	"chapters" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"date_of_publication" integer NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movie_genre" (
	"movie_id" integer,
	"genre_id" integer,
	"primary_genre" boolean DEFAULT false NOT NULL,
	CONSTRAINT "movie_genre_movie_id_genre_id_pk" PRIMARY KEY("movie_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movie" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"director" text NOT NULL,
	"studio" text NOT NULL,
	"duration" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tv_show_genre" (
	"tv_show_id" integer,
	"genre_id" integer,
	"primary_genre" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tv_show_genre_tv_show_id_genre_id_pk" PRIMARY KEY("tv_show_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tv_show" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"creator" text NOT NULL,
	"network" text NOT NULL,
	"seasons" integer NOT NULL,
	"episodes" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_media" (
	"user_id" text NOT NULL,
	"media_id" integer NOT NULL,
	"stage" "stage" NOT NULL,
	CONSTRAINT "user_media_user_id_media_id_pk" PRIMARY KEY("user_id","media_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "provider" NOT NULL,
	"provider_id" integer NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"image_url" text,
	CONSTRAINT "user_id_unique" UNIQUE("id"),
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_game_genre" (
	"video_game_id" integer,
	"genre_id" integer,
	"primary_genre" boolean DEFAULT false NOT NULL,
	CONSTRAINT "video_game_genre_video_game_id_genre_id_pk" PRIMARY KEY("video_game_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_game" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"developer" text NOT NULL,
	"publisher" text NOT NULL,
	"platforms" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "anime" ADD CONSTRAINT "anime_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_genre" ADD CONSTRAINT "book_genre_book_id_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book_genre" ADD CONSTRAINT "book_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "book" ADD CONSTRAINT "book_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manga_genre" ADD CONSTRAINT "manga_genre_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manga_genre" ADD CONSTRAINT "manga_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manga" ADD CONSTRAINT "manga_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movie_genre" ADD CONSTRAINT "movie_genre_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movie"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movie_genre" ADD CONSTRAINT "movie_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movie" ADD CONSTRAINT "movie_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tv_show_genre" ADD CONSTRAINT "tv_show_genre_tv_show_id_tv_show_id_fk" FOREIGN KEY ("tv_show_id") REFERENCES "public"."tv_show"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tv_show_genre" ADD CONSTRAINT "tv_show_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tv_show" ADD CONSTRAINT "tv_show_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_media" ADD CONSTRAINT "user_media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_media" ADD CONSTRAINT "user_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_game_genre" ADD CONSTRAINT "video_game_genre_video_game_id_video_game_id_fk" FOREIGN KEY ("video_game_id") REFERENCES "public"."video_game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_game_genre" ADD CONSTRAINT "video_game_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_game" ADD CONSTRAINT "video_game_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
