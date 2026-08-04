/**
 * Search hit types and the SearchType union used by both the search API
 * route and the search page. Kept in $lib/types (not $lib/server) so the
 * page can import them without crossing the server/client boundary.
 */

export type TmdbSearchHit =
	| {
			type: "movie";
			id: number;
			title: string;
			original_title: string;
			overview: string;
			release_date: string; // "YYYY-MM-DD" or ""
			poster_path: string | null;
			backdrop_path: string | null;
			vote_average: number;
	  }
	| {
			type: "tv";
			id: number;
			name: string;
			original_name: string;
			overview: string;
			first_air_date: string;
			poster_path: string | null;
			backdrop_path: string | null;
			vote_average: number;
	  };

export type IgdbSearchHit = {
	type: "game";
	id: number;
	name: string;
	summary: string;
	firstReleaseDate: number | null; // unix seconds
	coverImageId: string | null;
	platforms: string[];
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
			episodes: number | null;
	  }
	| {
			type: "manga";
			id: number;
			title: string;
			imageUrl: string | null;
			year: number | null;
			chapters: number | null;
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

export const VALID_SEARCH_TYPES: SearchType[] = ["all", "movie", "tv", "game", "anime", "manga", "music", "book"];
