/**
 * Shared helpers for media_parts (episodes, chapters, tracks, etc).
 *
 * Unlike top-level media_items, parts don't need cross-source dedup or an
 * external_ids table — a part's identity is fully defined by
 * (mediaItemId, partType, partNumber, parentPartId), since it always
 * belongs to exactly one already-imported media_item from exactly one
 * source. "Does this part already exist" is just a direct lookup.
 */

import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { mediaParts } from "./db/schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type PartType = "season" | "episode" | "chapter" | "volume" | "arc" | "saga" | "track";

export async function findPart(
	mediaItemId: string,
	partType: PartType,
	partNumber: number,
	parentPartId: string | null,
): Promise<string | null> {
	const rows = await db
		.select({ id: mediaParts.id })
		.from(mediaParts)
		.where(
			and(
				eq(mediaParts.mediaItemId, mediaItemId),
				eq(mediaParts.partType, partType),
				eq(mediaParts.partNumber, partNumber),
				parentPartId ? eq(mediaParts.parentPartId, parentPartId) : isNull(mediaParts.parentPartId),
			),
		)
		.limit(1);
	return rows[0]?.id ?? null;
}

export async function findChildParts(parentPartId: string) {
	return db.select().from(mediaParts).where(eq(mediaParts.parentPartId, parentPartId)).orderBy(mediaParts.partNumber);
}

export async function findFlatParts(mediaItemId: string, partType: PartType) {
	return db
		.select()
		.from(mediaParts)
		.where(
			and(eq(mediaParts.mediaItemId, mediaItemId), eq(mediaParts.partType, partType), isNull(mediaParts.parentPartId)),
		)
		.orderBy(mediaParts.partNumber);
}

export async function createPart(
	tx: DbTransaction,
	params: {
		mediaItemId: string;
		parentPartId: string | null;
		partType: PartType;
		partNumber: number;
		title: string | null;
		releaseDate: string | null;
		metadata: Record<string, unknown>;
	},
): Promise<string> {
	const [inserted] = await tx
		.insert(mediaParts)
		.values({
			mediaItemId: params.mediaItemId,
			parentPartId: params.parentPartId,
			partType: params.partType,
			partNumber: params.partNumber,
			title: params.title,
			releaseDate: params.releaseDate,
			metadata: params.metadata,
		})
		.returning({ id: mediaParts.id });
	return inserted.id;
}
