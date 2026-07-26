/**
 * One-time transition script: marks every CURRENT migration file in
 * drizzle/ as "already applied" against a database whose live schema
 * already matches them (because it's been kept in sync via db:push, not
 * db:migrate). This lets you start using `drizzle-kit migrate` going
 * forward — generate + review + migrate for anything new — without it
 * trying to replay your entire migration history and failing on
 * "already exists" errors.
 *
 * Uses drizzle-orm's OWN readMigrationFiles() to compute migration
 * hashes — the same function `migrate()` uses internally — rather than
 * reimplementing that logic, since getting a hash mismatch wrong here
 * would cause `migrate` to either skip something it shouldn't or try to
 * re-run something it shouldn't.
 *
 * Safe to re-run: it only inserts a hash if it isn't already recorded.
 *
 * Run this ONCE per database, after you're satisfied that database's
 * live schema fully matches your current drizzle/ migration files (i.e.
 * right after a clean db:push with no pending changes reported).
 *
 * Usage:
 *   node scripts/baseline-migrations.mjs           # local DB
 *   node scripts/baseline-migrations.mjs --remote  # Neon
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const REMOTE = process.argv.includes("--remote");
if (REMOTE) {
	config({ path: resolve(".env"), override: true });
} else if (process.env.NODE_ENV !== "production") {
	config({ path: resolve(".env.development"), override: true });
}

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

async function main() {
	const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
	console.log(`Found ${migrations.length} migration file(s) in drizzle/.`);

	const sql = postgres(databaseUrl, { max: 1 });

	try {
		await sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
		await sql`
			CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;

		const existing = await sql`SELECT hash FROM "drizzle"."__drizzle_migrations"`;
		const existingHashes = new Set(existing.map((r) => r.hash));

		let inserted = 0;
		for (const m of migrations) {
			if (existingHashes.has(m.hash)) continue;
			await sql`
				INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
				VALUES (${m.hash}, ${m.folderMillis})
			`;
			inserted++;
			console.log(`  Marked as applied: hash ${m.hash.slice(0, 12)}... (${m.sql.length} statement(s))`);
		}

		console.log(`\n${inserted} migration(s) newly marked as applied, ${migrations.length - inserted} already were.`);
		console.log("You can now use `drizzle-kit migrate` against this database for future schema changes.");
	} finally {
		await sql.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
