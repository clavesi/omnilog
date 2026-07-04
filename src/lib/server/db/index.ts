import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DATABASE_URL } from "$env/static/private";
import * as schema from "./schema";

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(DATABASE_URL, {
	// Neon's pooled connection requires SSL; local Docker doesn't.
	// The `postgres` lib auto-detects based on the URL's sslmode param,
	// so just put sslmode=require in your prod DATABASE_URL.
	max: 10,
});

export const db = drizzle(client, { schema });
