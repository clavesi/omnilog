/**
 * The allowed reaction set.
 *
 * Kept in $lib (not $lib/server) because both the picker and the write-path
 * validation need it, and they must agree. Stored in the database as plain
 * text rather than an enum so this list can change without a migration —
 * removing one leaves existing rows intact but unrenderable in the picker,
 * which is the intended behaviour.
 */
export const REACTIONS = [
	{ emoji: "👍", label: "Like" },
	{ emoji: "❤️", label: "Love" },
	{ emoji: "😂", label: "Funny" },
	{ emoji: "😮", label: "Surprising" },
	{ emoji: "😢", label: "Moving" },
	{ emoji: "🔥", label: "Fire" },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]["emoji"];

const ALLOWED = new Set<string>(REACTIONS.map((r) => r.emoji));

export function isValidReaction(emoji: string): emoji is ReactionEmoji {
	return ALLOWED.has(emoji);
}

export function reactionLabel(emoji: string): string {
	return REACTIONS.find((r) => r.emoji === emoji)?.label ?? emoji;
}
