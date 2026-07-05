const TMDB_IMAGE = "https://image.tmdb.org/t/p";
const IGDB_IMAGE = "https://images.igdb.com/igdb/image/upload";
const OL_COVERS_BASE = "https://covers.openlibrary.org/b/id";

export function tmdbImage(path: string | null, size: "w185" | "w342" | "w500" | "original" = "w342"): string | null {
	return path ? `${TMDB_IMAGE}/${size}${path}` : null;
}

export function igdbImage(
	imageId: string | null,
	size: "cover_small" | "cover_big" | "screenshot_med" | "1080p" = "cover_big",
): string | null {
	return imageId ? `${IGDB_IMAGE}/t_${size}/${imageId}.jpg` : null;
}

export function openLibraryImage(coverId: number | null, size: "S" | "M" | "L" = "M"): string | null {
	return coverId ? `${OL_COVERS_BASE}/${coverId}-${size}.jpg` : null;
}
