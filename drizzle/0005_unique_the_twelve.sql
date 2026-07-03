ALTER TABLE "logs" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "logs_public_created_at_idx" ON "logs" USING btree ("is_public","created_at");