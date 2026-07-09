import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs } from "$lib/server/db/schema";
import { parseLogFormData } from "$lib/server/log-form";
import { requireItemBySlug, requireLogForItem, requireOwnedLogForItemAction } from "$lib/server/log-routes";
import { recomputeAggregate } from "$lib/server/media-aggregate";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const { params } = event;

	const item = await requireItemBySlug(params.slug);

	const [existingLog] = await db.select().from(logs).where(eq(logs.id, params.logId)).limit(1);
	if (!existingLog) throw error(404, "Log not found");
	requireLogForItem(existingLog, item.id, user.id);

	return {
		item,
		log: existingLog,
		today: new Date().toISOString().slice(0, 10),
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const item = await requireItemBySlug(params.slug);
		const existingLog = await requireOwnedLogForItemAction(params.logId, item.id, user.id);
		if ("status" in existingLog) return existingLog;

		const form = await request.formData();

		const parsed = parseLogFormData(form);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const { rating, loggedAt, reviewBody, reviewTitle, containsSpoilers, isPublic } = parsed.fields;

		await db
			.update(logs)
			.set({
				rating,
				loggedAt,
				reviewTitle,
				reviewBody,
				containsSpoilers: containsSpoilers && reviewBody !== null,
				isPublic,
				updatedAt: new Date(),
			})
			.where(eq(logs.id, params.logId));

		if (existingLog.mediaItemId) {
			await recomputeAggregate(existingLog.mediaItemId);
		}

		redirect(303, `/media/${params.slug}`);
	},
};
