/** Ordinal label for repeat viewings — e.g. "2nd watch", "3rd watch". */
export function formatWatchLabel(watchNumber: number, isRewatch: boolean): string | null {
	if (watchNumber > 1) {
		if (watchNumber === 2) return "2nd watch";
		if (watchNumber === 3) return "3rd watch";
		return `${watchNumber}th watch`;
	}
	// Rows logged before watchNumber existed may have isRewatch without a count.
	if (isRewatch) return "Rewatch";
	return null;
}
