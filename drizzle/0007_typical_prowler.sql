ALTER TABLE "media_parts" ADD COLUMN "average_rating" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "media_parts" ADD COLUMN "rating_count" integer DEFAULT 0 NOT NULL;