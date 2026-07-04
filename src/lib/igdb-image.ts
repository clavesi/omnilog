const IGDB_IMAGE = "https://images.igdb.com/igdb/image/upload";

export function igdbImage(
	imageId: string | null,
	size: "cover_small" | "cover_big" | "screenshot_med" | "1080p" = "cover_big",
): string | null {
	return imageId ? `${IGDB_IMAGE}/t_${size}/${imageId}.jpg` : null;
}
