import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs } from "$lib/server/db/schema";
import { parseLogFormData } from "$lib/server/log-form";
import { requireLogForPart, requireOwnedLogForPartAction, requirePartForItem } from "$lib/server/log-routes";
import { safeRelativePath } from "$lib/server/safe-path";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const { params, url } = event;

	const { item, part } = await requirePartForItem(params.slug, params.partId);

	const [existingLog] = await db.select().from(logs).where(eq(logs.id, params.logId)).limit(1);
	if (!existingLog) throw error(404, "Log not found");
	requireLogForPart(existingLog, part.id, user.id);

	const returnTo = safeRelativePath(url.searchParams.get("returnTo"), `/media/${params.slug}/part/${params.partId}`);

	return {
		item,
		part,
		log: existingLog,
		today: new Date().toISOString().slice(0, 10),
		returnTo,
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const { part } = await requirePartForItem(params.slug, params.partId);
		const existingLog = await requireOwnedLogForPartAction(params.logId, part.id, user.id);
		if ("status" in existingLog) return existingLog;

		const form = await request.formData();
		const returnTo = safeRelativePath(
			form.get("returnTo") as string | null,
			`/media/${params.slug}/part/${params.partId}`,
		);

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

		redirect(303, returnTo);
	},
};
