/**
 * Media status values, labels, and per-type progress units.
 *
 * In $lib rather than $lib/server because the media page control, the log
 * form prompt, and the library route all render these while the server
 * validates against the same list.
 */

export type MediaStatus = "planned" | "in_progress" | "completed" | "dropped" | "on_hold";

export const MEDIA_STATUS_OPTIONS: { value: MediaStatus; label: string }[] = [
	{ value: "planned", label: "Planned" },
	{ value: "in_progress", label: "In progress" },
	{ value: "completed", label: "Completed" },
	{ value: "on_hold", label: "On hold" },
	{ value: "dropped", label: "Dropped" },
];

const VALUES = new Set<string>(MEDIA_STATUS_OPTIONS.map((o) => o.value));

export function isMediaStatus(value: string): value is MediaStatus {
	return VALUES.has(value);
}

export function mediaStatusLabel(value: string): string {
	return MEDIA_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/**
 * What `progress` counts, per media type.
 *
 * Null means the type has no meaningful unit to count — a film is watched or
 * it isn't, and an album's status is enough without tracking which track
 * you're on. The progress input is hidden entirely for those.
 */
const PROGRESS_UNITS: Record<string, { singular: string; plural: string } | null> = {
	tv: { singular: "episode", plural: "episodes" },
	anime: { singular: "episode", plural: "episodes" },
	manga: { singular: "chapter", plural: "chapters" },
	book: { singular: "page", plural: "pages" },
	game: { singular: "hour", plural: "hours" },
	movie: null,
	music: null,
};

export function progressUnit(mediaType: string): { singular: string; plural: string } | null {
	return PROGRESS_UNITS[mediaType] ?? null;
}

export function supportsProgress(mediaType: string): boolean {
	return progressUnit(mediaType) !== null;
}

export function formatProgress(mediaType: string, progress: number | null): string | null {
	if (progress == null) return null;
	const unit = progressUnit(mediaType);
	if (!unit) return null;
	return `${progress} ${progress === 1 ? unit.singular : unit.plural}`;
}
