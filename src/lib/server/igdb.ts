import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "$env/static/private";
import { igdbImage } from "$lib/media-images";
import { db } from "$lib/server/db";
import { type GameMetadata, mediaExternalIds, mediaItems, mediaMetadata } from "$lib/server/db/schema";
import { buildSlug, findExistingMediaId, linkGenres } from "$lib/server/media-import";

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

async function igdb<T>(endpoint: string, query: string): Promise<T> {
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
};

export type IgdbSearchHit = {
	type: "game";
	id: number;
	name: string;
	summary: string;
	firstReleaseDate: number | null; // unix seconds
	coverImageId: string | null;
	platforms: string[];
};

// ============================================================================
// Public: search
// ============================================================================

const SEARCH_FIELDS = "name,summary,first_release_date,cover.image_id,platforms.name";

export async function searchGames(query: string): Promise<IgdbSearchHit[]> {
	if (!query.trim()) return [];

	// Apicalypse: double-quoted search string, semicolon-separated clauses.
	// Escape any embedded double quotes in the user's query to avoid breaking
	// the query syntax.
	const escaped = query.replace(/"/g, '\\"');
	const body = `search "${escaped}"; fields ${SEARCH_FIELDS}; limit 10; where cover != null;`;

	const results = await igdb<IgdbGameRaw[]>("games", body);

	return results.map((g) => ({
		type: "game" as const,
		id: g.id,
		name: g.name,
		summary: g.summary ?? "",
		firstReleaseDate: g.first_release_date ?? null,
		coverImageId: g.cover?.image_id ?? null,
		platforms: (g.platforms ?? []).map((p) => p.name),
	}));
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

		const developers = (game.involved_companies ?? []).filter((c) => c.developer).map((c) => c.company.name);
		const publishers = (game.involved_companies ?? []).filter((c) => c.publisher).map((c) => c.company.name);

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
