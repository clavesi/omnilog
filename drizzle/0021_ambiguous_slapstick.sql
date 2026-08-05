DROP INDEX "log_reactions_log_user_emoji_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "log_reactions_log_user_unique" ON "log_reactions" USING btree ("log_id","user_id");--> statement-breakpoint
ALTER TABLE "log_comments" DROP COLUMN "deleted_at";