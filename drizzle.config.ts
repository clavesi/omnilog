import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/lib/db/schema.ts",
	out: "./supabase/migrations",
	dbCredentials: {
		url: process.env.DATABASE_URL as string,
		host: "localhost",
		port: 5432,
		user: "postgres",
		password: "postgres",
		database: "supabase",
	}
});
