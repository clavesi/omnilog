/**
 * Label for a repeat viewing.
 */
export function formatWatchLabel(isRewatch: boolean): string | null {
	return isRewatch ? "Rewatch" : null;
}
