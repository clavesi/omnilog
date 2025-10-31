import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env first, then .env.local (which will override .env values)
// dotenv doesn't override existing vars by default, so we load .env.local with override: true
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
	schema: "./src/lib/schema.ts",
	out: "./supabase/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
