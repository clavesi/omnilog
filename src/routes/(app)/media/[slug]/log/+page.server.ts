import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { getDefaultCommentPolicy } from "$lib/server/comments";
import { db } from "$lib/server/db";
import { logs, mediaItems } from "$lib/server/db/schema";
import { parseLogFormData } from "$lib/server/log-form";
import { requireItemBySlug } from "$lib/server/log-routes";
import { countUserLogsForItem } from "$lib/server/logs";
import { recomputeAggregate } from "$lib/server/media-aggregate";
import { getStatus, markCompleted as markItemCompleted } from "$lib/server/media-status";
import { getTagSuggestions, setLogTags } from "$lib/server/tags";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const { params } = event;

	const item = await requireItemBySlug(params.slug);

	const priorCount = await countUserLogsForItem(user.id, item.id);

	return {
		defaultCommentPolicy: await getDefaultCommentPolicy(user.id),
		tagSuggestions: await getTagSuggestions(user.id),
		item,
		hasPriorLog: priorCount > 0,
		alreadyCompleted: (await getStatus(user.id, item.id))?.status === "completed",
		today: new Date().toISOString().slice(0, 10),
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const form = await request.formData();

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);

		if (!item) return fail(404, { error: "Media not found" });

		const parsed = parseLogFormData(form);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		const {
			rating,
			loggedAt,
			reviewBody,
			reviewTitle,
			containsSpoilers,
			isPublic,
			isRewatch,
			markCompleted,
			commentPolicy,
			tags,
		} = parsed.fields;

		const [created] = await db
			.insert(logs)
			.values({
				userId: user.id,
				commentPolicy: commentPolicy ?? (await getDefaultCommentPolicy(user.id)),
				mediaItemId: item.id,
				mediaPartId: null,
				loggedAt,
				rating,
				reviewTitle,
				reviewBody,
				// Spoiler flag only applies when there's a review to hide.
				containsSpoilers: containsSpoilers && reviewBody !== null,
				isRewatch,
				isPublic,
			})
			.returning({ id: logs.id });

		await setLogTags(created.id, tags);

		// Opt-in via the form's checkbox — logging isn't assumed to mean finished.
		if (markCompleted) await markItemCompleted(user.id, item.id);

		await recomputeAggregate(item.id);

		redirect(303, `/media/${params.slug}`);
	},
};
