/**
 * Shape passed to LogCard after a loader resolves media context.
 *
 * Logs in the DB only store mediaItemId or mediaPartId (never both). Loaders
 * either join through log-media-joins (feed, profile) or attachItemMedia when
 * the page already has the item loaded (media/part detail pages).
 */
export type LogCardData = {
	id: string;
	/** Present when the page needs isOwner checks (e.g. media detail). */
	userId?: string;
	rating: number | null;
	reviewTitle: string | null;
	reviewBody: string | null;
	containsSpoilers: boolean;
	isRewatch: boolean;
	watchNumber: number;
	isPublic: boolean;
	mediaPartId: string | null;
	loggedAt: string | null;
	createdAt: string | Date;
	mediaSlug: string;
	mediaTitle: string;
	mediaCoverUrl: string | null;
	mediaType?: string | null;
	partTitle?: string | null;
	partNumber?: number | null;
	/** TV season number — comes from the episode's parent part row. */
	seasonNumber?: number | null;
	username?: string;
};

/** Pre-filled form state for LogForm edit mode. */
export type LogFormInitial = {
	rating: number | null;
	loggedAt: string;
	reviewBody: string;
	reviewTitle: string;
	containsSpoilers: boolean;
	isPublic: boolean;
	showReview: boolean;
};
