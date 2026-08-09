import { and, count, desc, eq, sql } from "drizzle-orm";
import type { MediaStatus } from "$lib/media-status";
import { db } from "./db";
import { mediaItems, userMediaStatus } from "./db/schema";

export type StatusRow = {
	status: MediaStatus;
	progress: number | null;
	startedAt: Date | null;
	completedAt: Date | null;
};

export type StatusEntry = StatusRow & {
	mediaItem: {
		id: string;
		slug: string;
		title: string;
		mediaType: string;
		coverImageUrl: string | null;
		releaseDate: string | null;
	};
};

/** The viewer's own status for one media item, or null if they've set none. */
export async function getStatus(userId: string, mediaItemId: string): Promise<StatusRow | null> {
	const [row] = await db
		.select({
			status: userMediaStatus.status,
			progress: userMediaStatus.progress,
			startedAt: userMediaStatus.startedAt,
			completedAt: userMediaStatus.completedAt,
		})
		.from(userMediaStatus)
		.where(and(eq(userMediaStatus.userId, userId), eq(userMediaStatus.mediaItemId, mediaItemId)))
		.limit(1);

	return (row as StatusRow | undefined) ?? null;
}

/**
 * Set or update a status. Upserts on the (user, media) unique index.
 *
 * `startedAt` and `completedAt` are stamped on the transition into
 * in_progress and completed respectively, and only when not already set —
 * re-marking something completed shouldn't rewrite the original date, and
 * moving completed → in_progress (a rewatch in progress) shouldn't clear the
 * fact that it was finished once.
 */
export async function setStatus(params: {
	userId: string;
	mediaItemId: string;
	status: MediaStatus;
	progress?: number | null;
}): Promise<void> {
	const { userId, mediaItemId, status } = params;
	const progress = params.progress ?? null;

	const existing = await getStatus(userId, mediaItemId);
	const now = new Date();

	const startedAt = existing?.startedAt ?? (status === "in_progress" || status === "completed" ? now : null);
	const completedAt = existing?.completedAt ?? (status === "completed" ? now : null);

	await db
		.insert(userMediaStatus)
		.values({ userId, mediaItemId, status, progress, startedAt, completedAt, updatedAt: now })
		.onConflictDoUpdate({
			target: [userMediaStatus.userId, userMediaStatus.mediaItemId],
			set: { status, progress, startedAt, completedAt, updatedAt: now },
		});
}

/** Remove a status entirely — the "no status" option in the picker. */
export async function clearStatus(userId: string, mediaItemId: string): Promise<void> {
	await db
		.delete(userMediaStatus)
		.where(and(eq(userMediaStatus.userId, userId), eq(userMediaStatus.mediaItemId, mediaItemId)));
}

/**
 * Mark completed without disturbing progress — used by the log form's
 * "mark completed" prompt, which shouldn't reset a chapter count.
 */
export async function markCompleted(userId: string, mediaItemId: string): Promise<void> {
	const existing = await getStatus(userId, mediaItemId);
	await setStatus({
		userId,
		mediaItemId,
		status: "completed",
		progress: existing?.progress ?? null,
	});
}

/** A user's entries for one status, most recently updated first. */
export async function getStatusList(userId: string, status: MediaStatus): Promise<StatusEntry[]> {
	const rows = await db
		.select({
			status: userMediaStatus.status,
			progress: userMediaStatus.progress,
			startedAt: userMediaStatus.startedAt,
			completedAt: userMediaStatus.completedAt,
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			mediaType: mediaItems.mediaType,
			coverImageUrl: mediaItems.coverImageUrl,
			releaseDate: mediaItems.releaseDate,
		})
		.from(userMediaStatus)
		.innerJoin(mediaItems, eq(mediaItems.id, userMediaStatus.mediaItemId))
		.where(and(eq(userMediaStatus.userId, userId), eq(userMediaStatus.status, status)))
		.orderBy(desc(userMediaStatus.updatedAt));

	return rows.map((r) => ({
		status: r.status as MediaStatus,
		progress: r.progress,
		startedAt: r.startedAt,
		completedAt: r.completedAt,
		mediaItem: {
			id: r.id,
			slug: r.slug,
			title: r.title,
			mediaType: r.mediaType,
			coverImageUrl: r.coverImageUrl,
			releaseDate: r.releaseDate,
		},
	}));
}

/** Per-status counts for the library tabs, so empty tabs can be labelled. */
export async function getStatusCounts(userId: string): Promise<Record<string, number>> {
	const rows = await db
		.select({ status: userMediaStatus.status, total: count() })
		.from(userMediaStatus)
		.where(eq(userMediaStatus.userId, userId))
		.groupBy(userMediaStatus.status);

	const counts: Record<string, number> = {};
	for (const r of rows) counts[r.status] = r.total;
	return counts;
}

/** Total tracked items, for the profile link. */
export async function countTrackedItems(userId: string): Promise<number> {
	const [row] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(userMediaStatus)
		.where(eq(userMediaStatus.userId, userId));
	return row?.total ?? 0;
}
