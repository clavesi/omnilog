import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const UserTable = pgTable("users", {
	id: uuid("id").primaryKey(),
	name: text("name").notNull().notNull(),
	username: text("username").notNull(),
	email: text("email").notNull()
});
