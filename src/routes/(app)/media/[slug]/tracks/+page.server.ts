import { getUserLogIdsForParts, requireExternalId, requireItemBySlugOfType } from "$lib/server/log-routes";
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
	const item = await requireItemBySlugOfType(params.slug, "music");
	const mbid = await requireExternalId(item.id, "musicbrainz", "MusicBrainz");
	const tracks = await importAlbumTracks(item.id, mbid);
	const loggedPartLogIds = await getUserLogIdsForParts(
		locals.user?.id ?? null,
		tracks.map((t) => t.id),
	);

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
