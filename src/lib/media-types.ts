export interface MovieMetadata {
	type: "movie";
	runtime: number | null;
	original_language: string | null;
	tagline: string | null;
	status: string | null;
	tmdb_vote_average: number | null;
}

export interface TvMetadata {
	type: "tv";
	number_of_seasons: number | null;
	number_of_episodes: number | null;
	episode_run_time: number[] | null;
	original_language: string | null;
	status: string | null;
	tmdb_vote_average: number | null;
}

export interface BookMetadata {
	type: "book";
	page_count: number | null;
	isbn_10: string | null;
	isbn_13: string | null;
	publisher: string | null;
	authors: string[];
	language: string | null;
}

export interface GameMetadata {
	type: "game";
	platforms: string[];
	developers: string[];
	publishers: string[];
	igdb_rating: number | null;
	game_modes: string[];
}

export interface AnimeMetadata {
	type: "anime";
	episodes: number | null;
	duration_minutes: number | null;
	studios: string[];
	source: string | null;
	season: string | null;
	status: string | null;
}

export interface MangaMetadata {
	type: "manga";
	chapters: number | null;
	volumes: number | null;
	authors: string[];
	serialization: string | null;
	status: string | null;
}

export interface ComicMetadata {
	type: "comic";
	series: string | null;
	issue_number: number | null;
	authors: string[];
}

export interface MusicMetadata {
	type: "music";
	artists: string[];
	track_count: number | null;
	duration_seconds: number | null;
	label: string | null;
	album_type: string | null;
}

export interface UnknownMetadata {
	type: "unknown";
}

export type MediaMetadata =
	| MovieMetadata
	| TvMetadata
	| BookMetadata
	| GameMetadata
	| AnimeMetadata
	| MangaMetadata
	| ComicMetadata
	| MusicMetadata
	| UnknownMetadata;

export type MetadataForType<T extends MediaMetadata["type"]> = Extract<MediaMetadata, { type: T }>;
export const EMPTY_METADATA: UnknownMetadata = { type: "unknown" };

export const isMetadataType = <K extends MediaMetadata["type"]>(m: MediaMetadata, type: K): m is MetadataForType<K> =>
	m.type === type;
