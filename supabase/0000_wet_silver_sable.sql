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
CREATE TABLE IF NOT EXISTS "anime" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"studio" text NOT NULL,
	"seasons" integer NOT NULL,
	"episodes" integer NOT NULL
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
CREATE TABLE IF NOT EXISTS "video_game" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer,
	"developer" text NOT NULL,
	"publisher" text NOT NULL,
	"platforms" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_to_genres" (
	"media_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "media_to_genres_media_id_genre_id_pk" PRIMARY KEY("media_id","genre_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "anime" ADD CONSTRAINT "anime_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "manga" ADD CONSTRAINT "manga_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "video_game" ADD CONSTRAINT "video_game_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_to_genres" ADD CONSTRAINT "media_to_genres_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_to_genres" ADD CONSTRAINT "media_to_genres_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
