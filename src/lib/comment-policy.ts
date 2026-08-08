/**
 * Comment policy values, labels, and validation.
 */

export type CommentPolicy = "everyone" | "followers" | "nobody";

export const COMMENT_POLICY_OPTIONS: { value: CommentPolicy; label: string }[] = [
	{ value: "everyone", label: "Everyone" },
	{ value: "followers", label: "Followers only" },
	{ value: "nobody", label: "No one" },
];

const VALUES = new Set<string>(COMMENT_POLICY_OPTIONS.map((o) => o.value));

export function isCommentPolicy(value: string): value is CommentPolicy {
	return VALUES.has(value);
}

export function commentPolicyLabel(value: string): string {
	return COMMENT_POLICY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
