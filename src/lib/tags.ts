/**
 * Tag parsing, normalization, and limits.
 *
 * In $lib rather than $lib/server because the tag input enforces the same
 * rules the server does — if they disagree, the form silently accepts things
 * that get dropped on save.
 */

export const MAX_TAGS_PER_LOG = 10;
export const MAX_TAG_LENGTH = 30;

/**
 * The comparison key for a tag. Two tags are the same tag when their slugs
 * match, so "Comfort Watch", "comfort watch", and "comfort  watch" all
 * collapse together.
 *
 * Kept deliberately permissive about characters — people tag in their own
 * language, and stripping to ASCII would mangle that. Only whitespace and
 * case are normalized.
 */
export function tagSlug(raw: string): string {
	return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Display form: trimmed with runs of whitespace collapsed, casing preserved. */
export function tagDisplayName(raw: string): string {
	return raw.trim().replace(/\s+/g, " ");
}

export function isValidTag(raw: string): boolean {
	const name = tagDisplayName(raw);
	return name.length > 0 && name.length <= MAX_TAG_LENGTH;
}

/**
 * Parse the comma-separated string the form submits into clean display
 * names — deduplicated by slug, invalid entries dropped, capped.
 *
 * Returns display names rather than slugs because the caller needs both, and
 * the slug is derivable from the name but not the reverse.
 */
export function parseTagList(raw: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];

	for (const piece of raw.split(",")) {
		if (!isValidTag(piece)) continue;
		const slug = tagSlug(piece);
		if (seen.has(slug)) continue;
		seen.add(slug);
		out.push(tagDisplayName(piece));
		if (out.length >= MAX_TAGS_PER_LOG) break;
	}

	return out;
}
