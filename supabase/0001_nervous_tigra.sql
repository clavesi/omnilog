CREATE SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."anime" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."book" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."genre" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."manga" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."media" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."movie" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."tv_show" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."user_media" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."video_game" SET SCHEMA "media_schema";
--> statement-breakpoint
ALTER TABLE "public"."media_to_genres" SET SCHEMA "media_schema";
