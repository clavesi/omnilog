import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["github", "google"]);

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
