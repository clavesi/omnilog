import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mediaItems, mediaParts } from "$lib/server/db/schema";
import { getLogsForPart } from "$lib/server/logs";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			coverImageUrl: mediaItems.coverImageUrl,
			mediaType: mediaItems.mediaType,
		})
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Media not found");

	const [part] = await db
		.select()
		.from(mediaParts)
		.where(and(eq(mediaParts.id, params.partId), eq(mediaParts.mediaItemId, item.id)))
		.limit(1);

	if (!part) throw error(404, "Part not found");

	let season: { id: string; partNumber: number } | null = null;
	if (part.parentPartId) {
		// TV episodes belong to a season part; anime episodes have no parent.
		const [s] = await db
			.select({ id: mediaParts.id, partNumber: mediaParts.partNumber })
			.from(mediaParts)
			.where(eq(mediaParts.id, part.parentPartId))
			.limit(1);
		season = s?.partNumber != null ? { id: s.id, partNumber: s.partNumber } : null;
	}

	const currentUserId = locals.user?.id ?? null;
	const logs = await getLogsForPart(part.id, currentUserId, item, {
		id: part.id,
		partNumber: part.partNumber,
		title: part.title,
		seasonNumber: season?.partNumber,
	});

	return {
		item,
		part,
		season,
		logs,
		currentUserId,
	};
};
