export type MediaTypeKey = "movie" | "tv" | "game" | "anime" | "manga" | "album" | "book";

export type SearchTypeKey = MediaTypeKey | "all" | "music";

const MEDIA_TYPE_COLORS: Record<MediaTypeKey, string> = {
	movie: "var(--color-movie)",
	tv: "var(--color-tv)",
	game: "var(--color-game)",
	anime: "var(--color-anime)",
	manga: "var(--color-manga)",
	album: "var(--color-album)",
	book: "var(--color-book)",
};

/** Maps DB/search type strings to a media-type color key. */
export function normalizeMediaType(type: string): MediaTypeKey | null {
	const t = type.toLowerCase();
	if (t === "music") return "album";
	if (t in MEDIA_TYPE_COLORS) return t as MediaTypeKey;
	return null;
}

export function getMediaTypeColor(type: string): string {
	const key = normalizeMediaType(type);
	return key ? MEDIA_TYPE_COLORS[key] : "var(--color-text-muted)";
}

export function getSearchTypeColor(type: SearchTypeKey): string {
	if (type === "all") return "var(--color-accent)";
	if (type === "music") return MEDIA_TYPE_COLORS.album;
	return MEDIA_TYPE_COLORS[type];
}

export function mediaTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		movie: "Movie",
		tv: "TV",
		game: "Game",
		anime: "Anime",
		manga: "Manga",
		music: "Album",
		book: "Book",
		comic: "Comic",
	};
	return labels[type.toLowerCase()] ?? type;
}
