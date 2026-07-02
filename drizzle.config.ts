import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

if (process.env.NODE_ENV !== "production") {
	config({ path: resolve(".env.development"), override: true });
}

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

export default defineConfig({
	schema: "./src/lib/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl,
	},
	verbose: true,
	strict: true,
});
