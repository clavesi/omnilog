export function formatPartLabel(opts: {
	seasonNumber?: number | null;
	partNumber: number;
	title?: string | null;
}): string {
	const { seasonNumber, partNumber, title } = opts;
	const prefix = seasonNumber != null ? `S${seasonNumber} E${partNumber}` : `E${partNumber}`;
	return title ? `${prefix} · ${title}` : prefix;
}
