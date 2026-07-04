/**
 * Cross-source duplicate detection for media that can be indexed by more than one catalog
 * — e.g. an anime film exists in both TMDB (as a movie) and MAL/Jikan (as an anime).
 *
 * Deliberately scoped to movie/tv/anime only. Games and manga are excluded:
 * a movie/show and a game can share a title while being genuinely distinct
 * works (e.g. "The Last of Us" the show vs "The Last of Us" the game), and
 * manga vs. anime are intentionally separate loggable entries in this app
 * (reading the manga is a different experience from watching the anime).
 *
 * Matching is fuzzy by necessity — there's no shared ID between TMDB and
 * MAL. Title is normalized (lowercased, punctuation stripped) and release
 * year must be within 1 year. This catches most duplicates (official
 * titles are usually shared verbatim) but can miss spelling/localization
 * variants, and in rare cases could false-positive on a genuine
 * same-title-different-work coincidence, so there's a confirmation step
 * rather than silently blocking the import.
 */

import { sql } from "drizzle-orm";
import { db } from "./db";
import { mediaItems } from "./db/schema";

export type DuplicateCandidate = {
	id: string;
	slug: string;
	title: string;
	mediaType: string;
	releaseDate: string | null;
	coverImageUrl: string | null;
};

export class PossibleDuplicateError extends Error {
	candidate: DuplicateCandidate;
	constructor(candidate: DuplicateCandidate) {
		super(`Possible duplicate: ${candidate.title}`);
		this.candidate = candidate;
	}
}

function normalizeTitle(t: string): string {
	return t
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

/**
 * Returns the existing media_items row this looks like a duplicate of, or
 * null if nothing matches. Caller decides what to do with a match (in our
 * case: throw PossibleDuplicateError so the import flow can surface a
 * confirmation step instead of silently creating a second entry).
 */
export async function findPossibleDuplicate(
	title: string,
	releaseDate: string | null, // "YYYY-MM-DD" or null
): Promise<DuplicateCandidate | null> {
	const normalized = normalizeTitle(title);
	if (!normalized) return null;

	const year = releaseDate ? Number(releaseDate.slice(0, 4)) : null;

	// Candidate set is small enough at MVP scale to fetch and compare in JS
	// rather than needing a fuzzy-match Postgres extension. Revisit if the
	// catalog grows into the tens of thousands of rows.
	const candidates = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			mediaType: mediaItems.mediaType,
			releaseDate: mediaItems.releaseDate,
			coverImageUrl: mediaItems.coverImageUrl,
		})
		.from(mediaItems)
		.where(sql`${mediaItems.mediaType} IN ('movie','tv','anime')`);

	for (const c of candidates) {
		if (normalizeTitle(c.title) !== normalized) continue;

		if (year !== null && c.releaseDate) {
			const cYear = Number(c.releaseDate.slice(0, 4));
			if (Math.abs(cYear - year) > 1) continue;
		}

		return c;
	}

	return null;
}
