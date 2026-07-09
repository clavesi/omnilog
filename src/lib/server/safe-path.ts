/**
 * Open-redirect guard for post-login and post-log redirects.
 * Rejects protocol-relative URLs (//evil.com) and absolute URLs — only
 * same-site paths starting with a single "/" are allowed.
 */
export function safeRelativePath(raw: string | null, fallback = "/feed"): string {
	if (!raw) return fallback;
	if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
	return raw;
}
