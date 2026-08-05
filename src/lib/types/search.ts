/**
 * Search hit types and the SearchType union used by both the search API
 * route and the search page. Kept in $lib/types (not $lib/server) so the
 * page can import them without crossing the server/client boundary.
 *
 * These carry only what the results list actually renders — nothing more.
 * Importing posts just the type and external id, and the full record is
 * fetched separately at import time, so anything the list doesn't display
 * is pure weight. Add a field here only when the UI starts using it.
 */

export type TmdbSearchHit =
	| {
			type: "movie";
			id: number;
			title: string;
			release_date: string; // "YYYY-MM-DD" or ""
			poster_path: string | null;
	  }
	| {
			type: "tv";
			id: number;
			name: string;
			first_air_date: string;
			poster_path: string | null;
	  };

export type IgdbSearchHit = {
	type: "game";
	id: number;
	name: string;
	firstReleaseDate: number | null; // unix seconds
	coverImageId: string | null;
	developers: string[];
	publishers: string[];
};

export type TenraiSearchHit =
	| {
			type: "anime";
			id: number;
			title: string;
			imageUrl: string | null;
			year: number | null;
	  }
	| {
			type: "manga";
			id: number;
			title: string;
			imageUrl: string | null;
			year: number | null;
	  };

export type MusicBrainzSearchHit = {
	type: "music";
	id: string; // MBID
	title: string;
	artists: string[];
	year: number | null;
	primaryType: string | null;
	coverUrl: string | null;
};

export type OpenLibrarySearchHit = {
	type: "book";
	id: string; // work id without the "/works/" prefix
	title: string;
	authors: string[];
	year: number | null;
	coverId: number | null;
};

export type SearchHit = TmdbSearchHit | IgdbSearchHit | TenraiSearchHit | MusicBrainzSearchHit | OpenLibrarySearchHit;

export type SearchType = "all" | "movie" | "tv" | "game" | "anime" | "manga" | "music" | "book";

/** Sub-filter for music results — MusicBrainz's release-group primary type. */
export type MusicPrimaryType = "all" | "album" | "ep" | "single";

export const VALID_MUSIC_PRIMARY_TYPES: MusicPrimaryType[] = ["all", "album", "ep", "single"];

export const VALID_SEARCH_TYPES: SearchType[] = ["all", "movie", "tv", "game", "anime", "manga", "music", "book"];
