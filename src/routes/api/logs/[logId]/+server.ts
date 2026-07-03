import { error, json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { logs } from "$lib/server/db/schema";
import { recomputeAggregate } from "$lib/server/media-aggregate";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, "Not logged in");

	const [existing] = await db
		.select({ id: logs.id, userId: logs.userId, mediaItemId: logs.mediaItemId })
		.from(logs)
		.where(eq(logs.id, params.logId))
		.limit(1);

	if (!existing) throw error(404, "Log not found");
	if (existing.userId !== locals.user.id) throw error(403, "Not your log");

	await db.delete(logs).where(and(eq(logs.id, params.logId), eq(logs.userId, locals.user.id)));

	if (existing.mediaItemId) {
		await recomputeAggregate(existing.mediaItemId);
	}

	return json({ success: true });
};
