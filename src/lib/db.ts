import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// Configure connection pool to prevent "max clients reached" errors
// In Session mode, Supabase limits concurrent connections to pool_size
// Set max to a reasonable number (10 is safe for most Supabase plans)
export const client = postgres(connectionString, {
	prepare: false,
	max: 10, // Maximum number of connections in the pool
	idle_timeout: 20, // Close idle connections after 20 seconds
	max_lifetime: 60 * 30, // Close connections after 30 minutes
});

export const db = drizzle(client);
