import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "$env/static/private";
import { igdbImage } from "$lib/media-images";
import { db } from "$lib/server/db";
import { type GameMetadata, mediaExternalIds, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { buildSlug, findExistingMediaId, linkGenres } from "$lib/server/media-import";
import { createPart, findFlatPartsOfTypes } from "$lib/server/parts";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";

// ============================================================================
// Token cache — IGDB tokens last ~60 days, but we refresh proactively with
// a safety margin rather than tracking the exact expiry down to the second.
// ============================================================================

let cachedToken: { accessToken: string; expiresAt: number } | null = null;
const TOKEN_SAFETY_MARGIN_MS = 60 * 60 * 1000; // refresh 1hr before actual expiry

async function getAccessToken(): Promise<string> {
	if (cachedToken && cachedToken.expiresAt > Date.now()) {
		return cachedToken.accessToken;
	}

	const url = new URL(TWITCH_TOKEN_URL);
	url.searchParams.set("client_id", TWITCH_CLIENT_ID);
	url.searchParams.set("client_secret", TWITCH_CLIENT_SECRET);
	url.searchParams.set("grant_type", "client_credentials");

	const res = await fetch(url, { method: "POST" });
	if (!res.ok) {
		throw new Error(`Twitch token request failed: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as { access_token: string; expires_in: number };
	cachedToken = {
		accessToken: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000 - TOKEN_SAFETY_MARGIN_MS,
	};

	return cachedToken.accessToken;
}

// ============================================================================
// Low-level IGDB request — POST with an Apicalypse query body
// ============================================================================

async function igdb<T>(endpoint: string, query: string, signal?: AbortSignal): Promise<T> {
	const token = await getAccessToken();

	const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
		method: "POST",
		headers: {
			"Client-ID": TWITCH_CLIENT_ID,
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
			"Content-Type": "text/plain",
		},
		body: query,
		signal,
	});

	if (!res.ok) {
		throw new Error(`IGDB ${endpoint} failed: ${res.status} ${res.statusText}`);
	}

	return res.json() as Promise<T>;
}

// ============================================================================
// Types — only the fields we actually request
// ============================================================================

type IgdbGameRaw = {
	id: number;
	name: string;
	slug: string;
	summary?: string;
	first_release_date?: number; // unix seconds
	cover?: { image_id: string };
	genres?: { id: number; name: string }[];
	platforms?: { name: string }[];
	involved_companies?: {
		company: { name: string };
		developer: boolean;
		publisher: boolean;
	}[];
	game_modes?: { name: string }[];
	total_rating?: number;
	total_rating_count?: number;
	dlcs?: number[];
	expansions?: number[];
};

/** Shape returned when we fetch add-on details in bulk. */
type IgdbAddOnRaw = {
	id: number;
	name: string;
	summary?: string;
	first_release_date?: number;
	cover?: { image_id: string };
};

import type { IgdbSearchHit } from "$lib/types/search";

// ============================================================================
// Public: search
// ============================================================================

const SEARCH_FIELDS =
	"name,summary,first_release_date,cover.image_id,platforms.name,total_rating_count,involved_companies.company.name,involved_companies.developer,involved_companies.publisher";

/**
 * IGDB returns one `involved_companies` row per company with boolean role
 * flags — a company can be both developer and publisher. Split into the two
 * lists we care about. Shared by search and import so they can't drift.
 */
function splitCompanies(game: IgdbGameRaw): { developers: string[]; publishers: string[] } {
	const involved = game.involved_companies ?? [];
	return {
		developers: involved.filter((c) => c.developer).map((c) => c.company.name),
		publishers: involved.filter((c) => c.publisher).map((c) => c.company.name),
	};
}

/**
 * Applied to every search strategy below.
 *
 *   version_parent = null  drops editions (Collector's, Ultimate, GOTY).
 *                          IGDB models these as *versions* of a game, and
 *                          they aren't distinct things anyone logs.
 *   parent_game = null     drops DLC and expansions — those are reachable
 *                          from the game's own page instead, via
 *                          importGameAddOns below.
 *   cover != null          drops entries too obscure to have art, which
 *                          correlates well with shovelware.
 */
const BASE_FILTERS = "version_parent = null & parent_game = null & cover != null";

/** Popularity proxy. Filter queries sort on it; keyword results are ranked by it client-side. */
const POPULARITY_SORT = "total_rating_count";

/**
 * Only DISPLAY_LIMIT results are ever shown. The extra headroom covers
 * overlap between strategies and gives the keyword tier a pool worth
 * re-ranking — but the filter tiers are already sorted server-side, so
 * there's no reason to pull far more than we display.
 */
const FETCH_LIMIT = 25;
const DISPLAY_LIMIT = 10;

/**
 * Strip characters that would break out of an Apicalypse string literal.
 * Returns null when nothing usable survives — a query of only quotes or
 * asterisks would otherwise become `name ~ *""*`, which matches every game
 * and returns whatever happens to be most-rated.
 */
function escapeQuery(query: string): string | null {
	const escaped = query.replace(/["*\\]/g, "").trim();
	return escaped.length > 0 ? escaped : null;
}

type SearchStrategy = {
	label: string;
	build: (escaped: string) => string;
	/** False when IGDB returns results in relevance order and we must re-rank. */
	preRanked: boolean;
};

/**
 * Tried in order, stopping as soon as a full page is assembled.
 *
 * The filter tiers exist because IGDB's `search` cannot be combined with
 * `sort` — search results arrive in a fixed relevance order that weights
 * exact name matches heavily.
 * Filters have no such restriction, so they can order by popularity.
 */
const SEARCH_STRATEGIES: SearchStrategy[] = [
	{
		// Substring match also handles partial words, which `search` can't:
		// "cyberpunk 2" matches "Cyberpunk 2077" here but returns nothing there.
		label: "name filter",
		build: (q) =>
			`fields ${SEARCH_FIELDS}; where name ~ *"${q}"* & ${BASE_FILTERS}; sort ${POPULARITY_SORT} desc; limit ${FETCH_LIMIT};`,
		preRanked: true,
	},
	{
		// Abbreviations live here rather than in `name` — "GTA V" is an
		// alternative name for "Grand Theft Auto V".
		label: "alternative name filter",
		build: (q) =>
			`fields ${SEARCH_FIELDS}; where alternative_names.name ~ *"${q}"* & ${BASE_FILTERS}; sort ${POPULARITY_SORT} desc; limit ${FETCH_LIMIT};`,
		preRanked: true,
	},
	{
		// Last resort: catches fuzzy matches and hyphenation the substring
		// filters miss ("half life" vs. "Half-Life").
		label: "keyword",
		build: (q) => `search "${q}"; fields ${SEARCH_FIELDS}; where ${BASE_FILTERS}; limit ${FETCH_LIMIT};`,
		preRanked: false,
	},
];

function toSearchHit(g: IgdbGameRaw): IgdbSearchHit {
	const { developers, publishers } = splitCompanies(g);
	return {
		type: "game" as const,
		id: g.id,
		name: g.name,
		summary: g.summary ?? "",
		firstReleaseDate: g.first_release_date ?? null,
		coverImageId: g.cover?.image_id ?? null,
		platforms: (g.platforms ?? []).map((p) => p.name),
		developers,
		publishers,
	};
}

export async function searchGames(query: string, signal?: AbortSignal): Promise<IgdbSearchHit[]> {
	const escaped = escapeQuery(query);
	if (!escaped) return [];

	const collected: IgdbGameRaw[] = [];
	const seen = new Set<number>();

	for (const strategy of SEARCH_STRATEGIES) {
		if (collected.length >= DISPLAY_LIMIT) break;

		let results: IgdbGameRaw[];
		try {
			results = await igdb<IgdbGameRaw[]>("games", strategy.build(escaped), signal);
		} catch (err) {
			// A cancelled request isn't a failure — let it propagate.
			if (signal?.aborted) throw err;
			// One bad strategy shouldn't take game search down; try the next.
			console.error(`IGDB ${strategy.label} search failed:`, err);
			continue;
		}

		if (!strategy.preRanked) {
			results.sort((a, b) => (b.total_rating_count ?? 0) - (a.total_rating_count ?? 0));
		}

		for (const g of results) {
			if (seen.has(g.id)) continue;
			seen.add(g.id);
			collected.push(g);
		}
	}

	return collected.slice(0, DISPLAY_LIMIT).map(toSearchHit);
}

// ============================================================================
// Public: fetch full details (for import)
// ============================================================================

const DETAIL_FIELDS =
	"name,slug,summary,first_release_date,cover.image_id,genres.name,platforms.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,game_modes.name,total_rating";

async function fetchGameDetails(igdbId: number): Promise<IgdbGameRaw> {
	const body = `where id = ${igdbId}; fields ${DETAIL_FIELDS}; limit 1;`;
	const results = await igdb<IgdbGameRaw[]>("games", body);
	if (!results[0]) throw new Error(`IGDB game ${igdbId} not found`);
	return results[0];
}

// ============================================================================
// Import: idempotent, mirrors importMovie/importTv from tmdb.ts
// ============================================================================

export async function importGame(igdbId: number): Promise<string> {
	const existing = await findExistingMediaId("igdb", String(igdbId));
	if (existing) return existing;

	const game = await fetchGameDetails(igdbId);

	return db.transaction(async (tx) => {
		const releaseDate = game.first_release_date
			? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
			: null;

		const [inserted] = await tx
			.insert(mediaItems)
			.values({
				slug: buildSlug(game.name, releaseDate, "game", igdbId),
				mediaType: "game",
				title: game.name,
				originalTitle: null,
				description: game.summary ?? null,
				releaseDate,
				coverImageUrl: igdbImage(game.cover?.image_id ?? null, "cover_big"),
				backdropImageUrl: null, // IGDB artworks are a separate endpoint — skip for v1
			})
			.returning({ id: mediaItems.id });

		const mediaItemId = inserted.id;

		await tx.insert(mediaExternalIds).values({
			mediaItemId,
			source: "igdb",
			externalId: String(igdbId),
			url: `https://www.igdb.com/games/${game.slug}`,
		});

		const { developers, publishers } = splitCompanies(game);

		const metadata: GameMetadata = {
			type: "game",
			platforms: (game.platforms ?? []).map((p) => p.name),
			developers,
			publishers,
			igdb_rating: game.total_rating ?? null,
			game_modes: (game.game_modes ?? []).map((m) => m.name),
		};

		await tx.insert(mediaMetadata).values({ mediaItemId, metadata });

		await linkGenres(tx, mediaItemId, game.genres ?? []);

		return mediaItemId;
	});
}

// ============================================================================
// Add-ons (DLC + expansions) as media_parts
//
// Deliberately NOT imported alongside the game. Same lazy pattern as
// importAlbumTracks: the first visit to /media/[slug]/dlc populates them, so
// importing a game stays a single round trip and games nobody opens the
// add-on page for never cost an extra request.
// ============================================================================

const ADDON_FIELDS = "name,summary,first_release_date,cover.image_id";

/**
 * Fetch details for a set of add-on ids. IGDB returns DLC and expansions as
 * plain game ids on the parent, so this is a second lookup rather than a
 * nested expansion — it keeps the field list flat and lets us drop entries
 * IGDB has stubbed out with no name.
 */
async function fetchAddOnDetails(ids: number[]): Promise<IgdbAddOnRaw[]> {
	if (ids.length === 0) return [];
	const body = `where id = (${ids.join(",")}); fields ${ADDON_FIELDS}; limit ${ids.length};`;
	return igdb<IgdbAddOnRaw[]>("games", body);
}

/**
 * Import a game's DLC and expansions as media_parts, once. Returns the
 * existing parts unchanged on subsequent calls.
 *
 * Ordering is by release date so the list reads chronologically; parts get
 * sequential numbers because partNumber is what findPart keys on and what
 * PartRow displays. IGDB's dlc/expansion split is preserved in partType even
 * though the page shows them together — it's free to keep and awkward to
 * reconstruct later.
 */
export async function importGameAddOns(mediaItemId: string, igdbId: number) {
	const existing = await findFlatPartsOfTypes(mediaItemId, ["dlc", "expansion"]);
	if (existing.length > 0) return existing;

	const body = `where id = ${igdbId}; fields dlcs,expansions; limit 1;`;
	const [game] = await igdb<IgdbGameRaw[]>("games", body);
	if (!game) return [];

	const dlcIds = game.dlcs ?? [];
	const expansionIds = game.expansions ?? [];
	if (dlcIds.length === 0 && expansionIds.length === 0) return [];

	const details = await fetchAddOnDetails([...dlcIds, ...expansionIds]);
	if (details.length === 0) return [];

	const expansionIdSet = new Set(expansionIds);

	// Undated add-ons sort last rather than pretending to be the earliest.
	const ordered = details
		.filter((d) => d.name)
		.sort(
			(a, b) => (a.first_release_date ?? Number.MAX_SAFE_INTEGER) - (b.first_release_date ?? Number.MAX_SAFE_INTEGER),
		);

	await db.transaction(async (tx) => {
		let position = 1;
		for (const addOn of ordered) {
			await createPart(tx, {
				mediaItemId,
				parentPartId: null,
				partType: expansionIdSet.has(addOn.id) ? "expansion" : "dlc",
				partNumber: position++,
				title: addOn.name,
				releaseDate: addOn.first_release_date
					? new Date(addOn.first_release_date * 1000).toISOString().slice(0, 10)
					: null,
				// media_parts has no cover column and no external_ids row, so
				// the IGDB id and art live here. See the note in parts.ts on
				// why parts don't get their own external id table.
				metadata: {
					igdbId: addOn.id,
					coverImageId: addOn.cover?.image_id ?? null,
					summary: addOn.summary ?? null,
				},
			});
		}
	});

	return findFlatPartsOfTypes(mediaItemId, ["dlc", "expansion"]);
}
