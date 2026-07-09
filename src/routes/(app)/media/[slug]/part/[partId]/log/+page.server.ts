import { fail, redirect } from "@sveltejs/kit";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs } from "$lib/server/db/schema";
import { parseLogFormData } from "$lib/server/log-form";
import { requirePartForItem, requirePartForItemAction } from "$lib/server/log-routes";
import { countUserLogsForPart } from "$lib/server/logs";
import { safeRelativePath } from "$lib/server/safe-path";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const { params, url } = event;

	const { item, part } = await requirePartForItem(params.slug, params.partId);

	const priorCount = await countUserLogsForPart(user.id, part.id);

	// returnTo lets the user land back on the episode page after saving (from ?returnTo= on the URL).
	const returnTo = safeRelativePath(url.searchParams.get("returnTo"), `/media/${params.slug}/part/${params.partId}`);

	return {
		item,
		part,
		hasPriorLog: priorCount > 0,
		today: new Date().toISOString().slice(0, 10),
		returnTo,
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const resolved = await requirePartForItemAction(params.slug, params.partId);
		if ("status" in resolved) return resolved;
		const { part } = resolved;

		const form = await request.formData();
		const returnTo = safeRelativePath(
			form.get("returnTo") as string | null,
			`/media/${params.slug}/part/${params.partId}`,
		);

		const parsed = parseLogFormData(form);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const { rating, loggedAt, reviewBody, reviewTitle, containsSpoilers, isPublic } = parsed.fields;

		const priorCount = await countUserLogsForPart(user.id, part.id);
		const watchNumber = priorCount + 1;
		const isRewatch = watchNumber > 1;

		await db.insert(logs).values({
			userId: user.id,
			mediaItemId: null,
			mediaPartId: part.id,
			loggedAt,
			rating,
			reviewTitle,
			reviewBody,
			containsSpoilers: containsSpoilers && reviewBody !== null,
			watchNumber,
			isRewatch,
			isPublic,
		});

		// Part-level ratings aren't aggregated on media_items yet — only whole-item logs update averageRating.

		redirect(303, returnTo);
	},
};
