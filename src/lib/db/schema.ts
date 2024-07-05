import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const UserTable = pgTable("users", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	username: varchar("username", { length: 255 }).notNull().unique(),
	email: varchar("email", { length: 255 }).notNull().unique()
});
