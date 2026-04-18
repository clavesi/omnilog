import {
    pgTable,
    uuid,
    text,
    timestamp,
    customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Uint8Array; default: false }>({
    dataType() {
        return "bytea";
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
