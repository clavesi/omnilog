import {
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["github", "google"]);

export const UserTable = pgTable(
	"user",
	{
		id: varchar("id", { length: 100 }).unique().notNull(),
		provider: providerEnum("provider").notNull(),
		providerId: integer("provider_id").notNull(),
		displayName: text("name").notNull(),
		username: varchar("username", { length: 255 }).notNull().unique(),
		email: varchar("email", { length: 255 }).notNull().unique()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.provider, table.providerId] })
		};
	}
);

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
