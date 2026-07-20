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
 * Matching is fuzzy by necessity — there's no shared ID between TMDB and MAL.
 * Two similarity signals are combined (whichever is stronger wins):
 *   - Token-set (Jaccard) similarity: catches word-order and word-count differences,
 *       e.g. "The Last: Naruto the Movie" vs "Naruto: The Last"
 *   - Levenshtein edit-distance similarity: catches spelling/localization variants that don't
 * 		 tokenize the same, e.g. "Shippuden" vs "Shippuuden" these produce different tokens (so Jaccard alone misses them) but a small edit distance on the full string.
 * 		 but a small edit distance on the full string.
 *
 * Each side of the comparison can supply MULTIPLE title variants, not just one
 * e.g. an anime import checks its English title, native/romaji title, and known synonyms all at once
 * against an existing candidate's title AND originalTitle.
 *
 * Release year must still be within 1 year as a pre-filter, fuzzy title matching only kicks in among same-era candidates.
 *
 * This can still miss title variants dissimilar enough to fall under the threshold, and in rare cases could false-positive
 * on a genuine same-title-different-work coincidence — hence the confirmation step rather than silently blocking the import.
 * Being somewhat permissive here is the right tradeoff: a false positive costs the user one extra click ("import anyway"),
 * a false negative costs a permanently duplicated catalog entry.
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

// ============================================================================
// Similarity scoring
// ============================================================================

/** Standard Levenshtein edit distance, O(min(m,n)) space via a rolling row. */
function levenshteinDistance(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	if (m === 0) return n;
	if (n === 0) return m;

	let prevRow = Array.from({ length: n + 1 }, (_, j) => j);

	for (let i = 1; i <= m; i++) {
		const currRow = [i];
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			currRow[j] = Math.min(
				prevRow[j] + 1, // deletion
				currRow[j - 1] + 1, // insertion
				prevRow[j - 1] + cost, // substitution
			);
		}
		prevRow = currRow;
	}

	return prevRow[n];
}

/** 1 = identical, 0 = completely different, scaled by the longer string's length. */
function levenshteinSimilarity(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	return 1 - levenshteinDistance(a, b) / maxLen;
}

function tokenize(normalized: string): Set<string> {
	return new Set(normalized.split(/\s+/).filter(Boolean));
}

/** Jaccard similarity of two token sets: |intersection| / |union|. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 && b.size === 0) return 1;
	let intersection = 0;
	for (const tok of a) {
		if (b.has(tok)) intersection++;
	}
	const union = a.size + b.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

/**
 * Combined title similarity, 0-1, for a single pair of already-normalized
 * titles. Takes whichever of the two signals is stronger.
 */
function titleSimilarity(a: string, b: string): number {
	if (a === b) return 1;
	const jaccard = jaccardSimilarity(tokenize(a), tokenize(b));
	const levenshtein = levenshteinSimilarity(a, b);
	return Math.max(jaccard, levenshtein);
}

/**
 * Best similarity across every pairing of two title-variant lists. Empty/
 * blank titles are dropped before comparing (a null title_english, say,
 * shouldn't spuriously score against something via empty-string handling).
 */
function bestTitleSimilarity(titlesA: string[], titlesB: string[]): number {
	const normA = titlesA.map(normalizeTitle).filter(Boolean);
	const normB = titlesB.map(normalizeTitle).filter(Boolean);

	let best = 0;
	for (const a of normA) {
		for (const b of normB) {
			const score = titleSimilarity(a, b);
			if (score > best) best = score;
		}
	}
	return best;
}

// Tuned to catch real variants (see file header example) while still
// requiring substantial overlap — not an exact science,
// revisit if it seems to be too loose/strict in practice.
const SIMILARITY_THRESHOLD = 0.72;

/**
 * Returns the existing media_items row this looks like a duplicate of, or
 * null if nothing matches closely enough. Caller decides what to do with a
 * match (in our case: throw PossibleDuplicateError so the import flow can
 * surface a confirmation step instead of silently creating a second entry).
 *
 * `titles` accepts every title variant the caller has on hand for the item
 * being imported (e.g. [englishTitle, romajiTitle, japaneseTitle,
 * ...synonyms].filter(Boolean)) — the more variants supplied, the better
 * the odds of catching a genuine cross-source duplicate. A single-element
 * array works fine too (e.g. for sources with only one title field).
 */
export async function findPossibleDuplicate(
	titles: string[],
	releaseDate: string | null, // "YYYY-MM-DD" or null
): Promise<DuplicateCandidate | null> {
	const cleanTitles = titles.filter((t) => t?.trim());
	if (cleanTitles.length === 0) return null;

	const year = releaseDate ? Number(releaseDate.slice(0, 4)) : null;

	// Candidate set is small enough at MVP scale to fetch and compare in JS
	// rather than needing a fuzzy-match Postgres extension (e.g. pg_trgm).
	// Revisit if the catalog grows into the tens of thousands of rows.
	const candidates = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			originalTitle: mediaItems.originalTitle,
			mediaType: mediaItems.mediaType,
			releaseDate: mediaItems.releaseDate,
			coverImageUrl: mediaItems.coverImageUrl,
		})
		.from(mediaItems)
		.where(sql`${mediaItems.mediaType} IN ('movie','tv','anime')`);

	let best: { candidate: DuplicateCandidate; score: number } | null = null;

	for (const c of candidates) {
		if (year !== null && c.releaseDate) {
			const cYear = Number(c.releaseDate.slice(0, 4));
			if (Math.abs(cYear - year) > 1) continue;
		}

		const candidateTitles = [c.title, c.originalTitle].filter((t): t is string => !!t?.trim());
		const score = bestTitleSimilarity(cleanTitles, candidateTitles);

		if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score)) {
			best = {
				candidate: {
					id: c.id,
					slug: c.slug,
					title: c.title,
					mediaType: c.mediaType,
					releaseDate: c.releaseDate,
					coverImageUrl: c.coverImageUrl,
				},
				score,
			};
		}
	}

	return best?.candidate ?? null;
}
