/**
 * Data model quirk: Open Library separates "works" (the abstract book,
 * e.g. "Harry Potter and the Philosopher's Stone" as a concept) from
 * "editions" (specific printings with ISBN/publisher/page count). Search
 * results and detail lookups operate on works; page count/publisher/ISBN
 * require an additional edition-level lookup.
 *
 * Scope note: genre linking is skipped for books. Open Library's "subjects"
 * are noisy free-text tags (hundreds per book, inconsistent vocabulary —
 * "Fiction", "New York Times bestseller", "Large type books" all mixed
 * together) rather than a clean genre taxonomy like TMDB/IGDB provide.
 * Tracked as a possible future enhancement rather than built now.
 */

import { openLibraryImage } from "$lib/media-images";
import { db } from "$lib/server/db";
import { type BookMetadata, mediaExternalIds, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { buildSlug, findExistingMediaId } from "$lib/server/media-import";

const OL_BASE = "https://openlibrary.org";

// ============================================================================
// Raw response shapes (only the fields we use)
// ============================================================================

type OlSearchDoc = {
	key: string; // "/works/OL45804W"
	title: string;
	author_name?: string[];
	first_publish_year?: number;
	cover_i?: number;
};

type OlDescription = string | { type: string; value: string };

type OlWorkDetail = {
	title: string;
	description?: OlDescription;
	covers?: number[];
	authors?: { author: { key: string } }[];
};

type OlAuthorDetail = { name: string };

type OlEdition = {
	number_of_pages?: number;
	isbn_10?: string[];
	isbn_13?: string[];
	publishers?: string[];
	publish_date?: string; // free text: "1997", "June 26, 1997", etc.
	languages?: { key: string }[]; // e.g. "/languages/eng"
};

// ============================================================================
// Public: search hit type
// ============================================================================

export type OpenLibrarySearchHit = {
	type: "book";
	id: string; // work id without the "/works/" prefix, e.g. "OL45804W"
	title: string;
	authors: string[];
	year: number | null;
	coverId: number | null;
};

// ============================================================================
// Public: search
// ============================================================================

export async function searchBooks(query: string, signal?: AbortSignal): Promise<OpenLibrarySearchHit[]> {
	if (!query.trim()) return [];

	const fields = "key,title,author_name,first_publish_year,cover_i";
	const res = await fetch(`${OL_BASE}/search.json?q=${encodeURIComponent(query)}&limit=10&fields=${fields}`, {
		signal,
	});
	if (!res.ok) {
		throw new Error(`Open Library search failed: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as { docs: OlSearchDoc[] };

	return data.docs.map(
		(d): OpenLibrarySearchHit => ({
			type: "book",
			id: d.key.replace("/works/", ""),
			title: d.title,
			authors: d.author_name ?? [],
			year: d.first_publish_year ?? null,
			coverId: d.cover_i ?? null,
		}),
	);
}

// ============================================================================
// Description normalization — OL returns either a plain string or
// { type, value } depending on the record, inconsistently.
// ============================================================================

function normalizeDescription(d: OlDescription | undefined): string | null {
	if (!d) return null;
	if (typeof d === "string") return d;
	return d.value ?? null;
}

/**
 * Open Library's publish_date is free text with no consistent format —
 * could be "1997", "June 26, 1997", "1997-06-26", or occasionally garbage.
 * Extract whatever 4-digit year we can find and normalize to Jan 1 of that
 * year, same convention used for Jikan's anime year-only dates.
 */
function parsePublishDateToIso(raw: string | undefined): string | null {
	if (!raw) return null;
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
	const yearMatch = raw.match(/\b(\d{4})\b/);
	return yearMatch ? `${yearMatch[1]}-01-01` : null;
}

// ============================================================================
// Public: fetch details (for import)
// ============================================================================

async function fetchWorkDetail(workId: string): Promise<OlWorkDetail> {
	const res = await fetch(`${OL_BASE}/works/${workId}.json`);
	if (!res.ok) throw new Error(`Open Library work ${workId} not found`);
	return res.json();
}

async function fetchAuthorNames(authorKeys: string[]): Promise<string[]> {
	const results = await Promise.all(
		authorKeys.map(async (key) => {
			try {
				const res = await fetch(`${OL_BASE}${key}.json`);
				if (!res.ok) return null;
				const data = (await res.json()) as OlAuthorDetail;
				return data.name ?? null;
			} catch {
				return null;
			}
		}),
	);
	return results.filter((n): n is string => n !== null);
}

async function fetchFirstEdition(workId: string): Promise<OlEdition | null> {
	const res = await fetch(`${OL_BASE}/works/${workId}/editions.json?limit=1`);
	if (!res.ok) return null;
	const data = (await res.json()) as { entries: OlEdition[] };
	return data.entries?.[0] ?? null;
}

// ============================================================================
// Import: idempotent, mirrors the other import*() functions.
// No cross-source duplicate check — books don't overlap with the
// movie/tv/anime catalogs the dedupe logic is scoped to.
// ============================================================================

export async function importBook(workId: string): Promise<string> {
	const existing = await findExistingMediaId("openlibrary", workId);
	if (existing) return existing;

	const [work, edition] = await Promise.all([fetchWorkDetail(workId), fetchFirstEdition(workId)]);

	const authorKeys = (work.authors ?? []).map((a) => a.author.key);
	const authors = await fetchAuthorNames(authorKeys);

	const coverId = work.covers?.[0] ?? null;
	const releaseDate = parsePublishDateToIso(edition?.publish_date);

	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(work.title, releaseDate, "book", workId),
				mediaType: "book",
				title: work.title,
				originalTitle: null,
				description: normalizeDescription(work.description),
				releaseDate,
				coverImageUrl: openLibraryImage(coverId, "L"),
				backdropImageUrl: null,
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "openlibrary",
			externalId: workId,
			url: `https://openlibrary.org/works/${workId}`,
		});

		const metadata: BookMetadata = {
			type: "book",
			page_count: edition?.number_of_pages ?? null,
			isbn_10: edition?.isbn_10?.[0] ?? null,
			isbn_13: edition?.isbn_13?.[0] ?? null,
			publisher: edition?.publishers?.[0] ?? null,
			authors,
			language: edition?.languages?.[0]?.key.replace("/languages/", "") ?? null,
		};

		await tx.insert(mediaMetadata).values({ mediaItemId, metadata });

		// No linkGenres call — see file header for why.

		return mediaItemId;
	});
}
