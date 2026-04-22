const TMDB_IMAGE = "https://image.tmdb.org/t/p";

export function tmdbImage(path: string | null, size: "w185" | "w342" | "w500" | "original" = "w342"): string | null {
	return path ? `${TMDB_IMAGE}/${size}${path}` : null;
}
