CREATE TYPE "public"."comment_policy" AS ENUM('everyone', 'followers', 'nobody');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'log_comment';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'log_reply';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'log_reaction';--> statement-breakpoint
CREATE TABLE "log_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"parent_comment_id" uuid,
	"body" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "log_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "notifications_user_actor_type_unique";--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "comment_policy" "comment_policy" DEFAULT 'everyone' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "target_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "log_comments" ADD CONSTRAINT "log_comments_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_comments" ADD CONSTRAINT "log_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_comments" ADD CONSTRAINT "log_comments_parent_comment_id_log_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."log_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_reactions" ADD CONSTRAINT "log_reactions_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_reactions" ADD CONSTRAINT "log_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "log_comments_log_idx" ON "log_comments" USING btree ("log_id","created_at");--> statement-breakpoint
CREATE INDEX "log_comments_parent_idx" ON "log_comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "log_comments_user_idx" ON "log_comments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "log_reactions_log_user_emoji_unique" ON "log_reactions" USING btree ("log_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "log_reactions_log_idx" ON "log_reactions" USING btree ("log_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_actor_type_target_unique" ON "notifications" USING btree ("user_id","actor_id","type","target_id");