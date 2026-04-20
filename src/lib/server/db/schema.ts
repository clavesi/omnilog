import { customType, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Uint8Array; default: false }>({
	dataType() {
		return "bytea";
	},
	// Drizzle needs a driver to convert the Uint8Array to a Buffer
	toDriver(value: Uint8Array): Buffer {
		return Buffer.from(value);
	},
	// Drizzle needs a driver to convert the Buffer to a Uint8Array
	fromDriver(value: unknown): Uint8Array {
		if (value instanceof Uint8Array) return value;
		if (Buffer.isBuffer(value)) return new Uint8Array(value);
		throw new Error("Expected bytea value from database");
	},
});

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	secretHash: bytea("secret_hash").notNull(),
	lastVerifiedAt: timestamp("last_verified_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
});
