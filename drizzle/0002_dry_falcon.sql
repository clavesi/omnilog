ALTER TABLE "media" ALTER COLUMN "media_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."media_type";--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv', 'book', 'manga', 'anime', 'comic', 'game', 'music');--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "media_type" SET DATA TYPE "public"."media_type" USING "media_type"::"public"."media_type";