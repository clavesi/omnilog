import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "$env/dynamic/private";
import * as schema from "./schema";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(env.DATABASE_URL, {
	// Neon's pooled connection requires SSL; local Docker doesn't.
	// The `postgres` lib auto-detects based on the URL's sslmode param,
	// so just put sslmode=require in your prod DATABASE_URL.
	max: 10,
});

export const db = drizzle(client, { schema });
