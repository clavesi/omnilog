import { error } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs, mediaExternalIds, mediaItems } from "$lib/server/db/schema";
import { importAlbumTracks } from "$lib/server/musicbrainz";
import type { PageServerLoad } from "./$types";

function formatDuration(ms: number | null): string | null {
	if (ms === null) return null;
	const totalSeconds = Math.round(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== "music") throw error(400, "Not an album");

	const [ext] = await db
		.select({ externalId: mediaExternalIds.externalId })
		.from(mediaExternalIds)
		.where(and(eq(mediaExternalIds.mediaItemId, item.id), eq(mediaExternalIds.source, "musicbrainz")))
		.limit(1);

	if (!ext) throw error(500, "No MusicBrainz external id found for this album");

	const tracks = await importAlbumTracks(item.id, ext.externalId);

	const loggedPartLogIds = new Map<string, string>();
	if (locals.user && tracks.length > 0) {
		const userLogs = await db
			.select({ id: logs.id, mediaPartId: logs.mediaPartId })
			.from(logs)
			.where(
				and(
					eq(logs.userId, locals.user.id),
					inArray(
						logs.mediaPartId,
						tracks.map((t) => t.id),
					),
				),
			);
		for (const l of userLogs) {
			if (l.mediaPartId) loggedPartLogIds.set(l.mediaPartId, l.id);
		}
	}

	return {
		item,
		tracks: tracks.map((t) => ({
			id: t.id,
			number: t.partNumber,
			title: t.title,
			duration: formatDuration((t.metadata as { durationMs?: number | null })?.durationMs ?? null),
			averageRating: t.averageRating,
			ratingCount: t.ratingCount,
			existingLogId: loggedPartLogIds.get(t.id) ?? null,
		})),
	};
};
