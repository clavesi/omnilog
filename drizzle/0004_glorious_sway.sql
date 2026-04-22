CREATE TYPE "public"."external_source" AS ENUM('tmdb', 'openlibrary', 'google_books', 'igdb', 'anilist', 'mal', 'musicbrainz');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('planned', 'in_progress', 'completed', 'dropped', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv', 'book', 'game', 'music', 'anime', 'manga', 'comic');--> statement-breakpoint
CREATE TYPE "public"."part_type" AS ENUM('season', 'episode', 'chapter', 'volume', 'arc', 'track');--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media_item_id" uuid,
	"media_part_id" uuid,
	"logged_at" date,
	"rating" smallint,
	"review_title" text,
	"review_body" text,
	"contains_spoilers" boolean DEFAULT false NOT NULL,
	"is_rewatch" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logs_target_check" CHECK (("logs"."media_item_id" IS NOT NULL AND "logs"."media_part_id" IS NULL) OR ("logs"."media_item_id" IS NULL AND "logs"."media_part_id" IS NOT NULL)),
	CONSTRAINT "logs_rating_range" CHECK ("logs"."rating" IS NULL OR "logs"."rating" BETWEEN 1 AND 10),
	CONSTRAINT "logs_logged_at_not_future" CHECK ("logs"."logged_at" IS NULL OR "logs"."logged_at" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "media_external_ids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_item_id" uuid NOT NULL,
	"source" "external_source" NOT NULL,
	"external_id" text NOT NULL,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_genres" (
	"media_item_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"media_type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"description" text,
	"release_date" date,
	"cover_image_url" text,
	"backdrop_image_url" text,
	"average_rating" numeric(3, 1),
	"rating_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_metadata" (
	"media_item_id" uuid PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{"type":"unknown"}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_item_id" uuid NOT NULL,
	"parent_part_id" uuid,
	"part_type" "part_type" NOT NULL,
	"number" integer,
	"title" text,
	"release_date" date,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_media_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media_item_id" uuid NOT NULL,
	"status" "media_status" NOT NULL,
	"progress" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "secret_hash" "bytea" NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_verified_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_media_part_id_media_parts_id_fk" FOREIGN KEY ("media_part_id") REFERENCES "public"."media_parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_external_ids" ADD CONSTRAINT "media_external_ids_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_genres" ADD CONSTRAINT "media_genres_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_genres" ADD CONSTRAINT "media_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_metadata" ADD CONSTRAINT "media_metadata_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_parts" ADD CONSTRAINT "media_parts_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_parts" ADD CONSTRAINT "media_parts_parent_part_id_media_parts_id_fk" FOREIGN KEY ("parent_part_id") REFERENCES "public"."media_parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_media_status" ADD CONSTRAINT "user_media_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_media_status" ADD CONSTRAINT "user_media_status_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "genres_slug_unique" ON "genres" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "logs_user_idx" ON "logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "logs_media_item_idx" ON "logs" USING btree ("media_item_id");--> statement-breakpoint
CREATE INDEX "logs_media_part_idx" ON "logs" USING btree ("media_part_id");--> statement-breakpoint
CREATE INDEX "logs_logged_at_idx" ON "logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "logs_created_at_idx" ON "logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "logs_user_item_idx" ON "logs" USING btree ("user_id","media_item_id");--> statement-breakpoint
CREATE INDEX "logs_user_part_idx" ON "logs" USING btree ("user_id","media_part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_external_ids_source_external_unique" ON "media_external_ids" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "media_external_ids_media_item_idx" ON "media_external_ids" USING btree ("media_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_genres_pk" ON "media_genres" USING btree ("media_item_id","genre_id");--> statement-breakpoint
CREATE INDEX "media_genres_media_item_id_idx" ON "media_genres" USING btree ("media_item_id");--> statement-breakpoint
CREATE INDEX "media_genres_genre_id_idx" ON "media_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_items_slug_unique" ON "media_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "media_items_type_idx" ON "media_items" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX "media_items_title_idx" ON "media_items" USING btree ("title");--> statement-breakpoint
CREATE INDEX "media_items_release_date_idx" ON "media_items" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX "media_parts_parent_part_id_idx" ON "media_parts" USING btree ("parent_part_id");--> statement-breakpoint
CREATE INDEX "media_parts_media_item_idx" ON "media_parts" USING btree ("media_item_id");--> statement-breakpoint
CREATE INDEX "media_parts_part_type_idx" ON "media_parts" USING btree ("part_type");--> statement-breakpoint
CREATE INDEX "user_media_statuses_user_id_idx" ON "user_media_status" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_media_status_user_media_unique" ON "user_media_status" USING btree ("user_id","media_item_id");--> statement-breakpoint
CREATE INDEX "user_media_status_user_status_idx" ON "user_media_status" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "expires_at";