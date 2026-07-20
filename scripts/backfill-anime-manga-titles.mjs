/**
 * Backfills title/originalTitle on already-imported anime/manga to match
 * the new preference logic in jikan.ts's resolvePreferredTitle(): prefer
 * Tenrai's title_english when available, store the native/romaji title as
 * originalTitle. Only affects rows imported before that logic existed —
 * new imports already get this right automatically.
 *
 * Deliberately does NOT touch `slug` — slugs are just URL identifiers and
 * changing them would break any existing bookmarked/shared links. Titles
 * and slugs are allowed to drift apart over time; that's normal and fine.
 *
 * Dry-run by default (just prints what WOULD change). Pass --apply to
 * actually write to the database.
 *
 * Usage:
 *   node scripts/backfill-anime-manga-titles.mjs                    # dry run, local DB
 *   node scripts/backfill-anime-manga-titles.mjs --apply             # actually update, local DB
 *   node scripts/backfill-anime-manga-titles.mjs --remote --apply    # against Neon instead of local Docker
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

// --remote is a CLI flag rather than reading DRIZZLE_TARGET from the shell
// environment — inline `VAR=value command` syntax (as used by some other
// scripts in this repo) is bash-only and breaks on Windows cmd.exe/
// PowerShell. A flag works identically cross-platform.
const REMOTE = process.argv.includes("--remote");

if (REMOTE || process.env.DRIZZLE_TARGET === "remote") {
	config({ path: resolve(".env"), override: true });
} else if (process.env.NODE_ENV !== "production") {
	config({ path: resolve(".env.development"), override: true });
}

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const APPLY = process.argv.includes("--apply");
const TENRAI_BASE = "https://api.tenrai.org/v1";
const REQUEST_GAP_MS = 400; // simple fixed delay — this is a background batch script, not a user-facing path

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTenraiDetail(kind, malId) {
	const res = await fetch(`${TENRAI_BASE}/${kind}/${malId}/full`);
	if (!res.ok) {
		throw new Error(`Tenrai ${kind}/${malId}/full failed: ${res.status} ${res.statusText}`);
	}
	const json = await res.json();
	return json.data;
}

/** Mirrors resolvePreferredTitle() in src/lib/server/jikan.ts — kept in
 * sync manually since this script can't import that file (it depends on
 * SvelteKit's $env/$lib aliases, which don't resolve outside of Vite). */
function resolvePreferredTitle(raw) {
	const primaryTitle = raw.title_english || raw.title;
	const originalTitle = raw.title_english ? raw.title : null;
	return { primaryTitle, originalTitle };
}

async function main() {
	const sql = postgres(databaseUrl, { max: 1 });

	try {
		const rows = await sql`
			SELECT
				mi.id,
				mi.title AS current_title,
				mi.original_title AS current_original_title,
				mi.media_type,
				mei.external_id
			FROM media_items mi
			JOIN media_external_ids mei
				ON mei.media_item_id = mi.id AND mei.source = 'mal'
			WHERE mi.media_type IN ('anime', 'manga')
			ORDER BY mi.created_at ASC
		`;

		console.log(`Found ${rows.length} anime/manga row(s) with a MAL external id.`);
		console.log(
			APPLY
				? "Mode: APPLY (will write changes)\n"
				: "Mode: DRY RUN (no changes will be written; pass --apply to commit)\n",
		);

		let changed = 0;
		let unchanged = 0;
		let errored = 0;

		for (const row of rows) {
			const kind = row.media_type; // "anime" | "manga"
			const malId = Number(row.external_id.replace(`${kind}:`, ""));

			if (!Number.isFinite(malId)) {
				console.warn(`  ! Skipping ${row.id} — couldn't parse MAL id from "${row.external_id}"`);
				errored++;
				continue;
			}

			try {
				const detail = await fetchTenraiDetail(kind, malId);
				const { primaryTitle, originalTitle } = resolvePreferredTitle(detail);

				const titleChanged = primaryTitle !== row.current_title;
				const originalChanged = originalTitle !== row.current_original_title;

				if (!titleChanged && !originalChanged) {
					unchanged++;
				} else {
					changed++;
					console.log(`  ${kind} ${malId}:`);
					if (titleChanged) console.log(`    title:         "${row.current_title}" -> "${primaryTitle}"`);
					if (originalChanged)
						console.log(`    originalTitle: "${row.current_original_title ?? "null"}" -> "${originalTitle ?? "null"}"`);

					if (APPLY) {
						await sql`
							UPDATE media_items
							SET title = ${primaryTitle}, original_title = ${originalTitle}, updated_at = now()
							WHERE id = ${row.id}
						`;
					}
				}
			} catch (err) {
				errored++;
				console.error(`  ! Failed on ${kind} ${malId} (${row.id}):`, err.message);
			}

			await sleep(REQUEST_GAP_MS);
		}

		console.log("\n---");
		console.log(`${changed} changed, ${unchanged} already correct, ${errored} errored.`);
		if (!APPLY && changed > 0) {
			console.log("Dry run only — re-run with --apply to write these changes.");
		}
	} finally {
		await sql.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
