import { error, fail, redirect } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, mediaItems } from "$lib/server/db/schema";
import { createPart, findFlatParts, findPart } from "$lib/server/parts";
import type { Actions, PageServerLoad } from "./$types";

// Only allow redirecting to a same-site relative path — same guard used
// elsewhere (login/signup returnTo, part log returnTo).
function safeReturnPath(raw: string | null, fallback: string): string {
	if (!raw) return fallback;
	if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
	return raw;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== "manga") throw error(400, "Not a manga");

	const chapters = await findFlatParts(item.id, "chapter");

	const loggedPartLogIds = new Map<string, string>();
	if (locals.user && chapters.length > 0) {
		const userLogs = await db
			.select({ id: logs.id, mediaPartId: logs.mediaPartId })
			.from(logs)
			.where(
				and(
					eq(logs.userId, locals.user.id),
					inArray(
						logs.mediaPartId,
						chapters.map((c) => c.id),
					),
				),
			);
		for (const l of userLogs) {
			if (l.mediaPartId) loggedPartLogIds.set(l.mediaPartId, l.id);
		}
	}

	return {
		item,
		chapters: chapters.map((c) => ({
			id: c.id,
			number: c.partNumber,
			title: c.title,
			averageRating: c.averageRating,
			ratingCount: c.ratingCount,
			existingLogId: loggedPartLogIds.get(c.id) ?? null,
		})),
	};
};

export const actions: Actions = {
	// Adds a chapter if it doesn't already exist, or just points the user at
	// the existing one if someone else already created that chapter number —
	// same "lazily created, then shared" model as episode imports, just
	// triggered by a person typing a number instead of an API response.
	addChapter: async (event) => {
		requireUser(event);
		const { request, params } = event;

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);

		if (!item) return fail(404, { error: "Manga not found" });

		const form = await request.formData();
		const numberRaw = form.get("chapterNumber");
		const titleRaw = form.get("title");
		const returnTo = safeReturnPath(form.get("returnTo") as string | null, `/media/${params.slug}/chapters`);

		const chapterNumber = Number(numberRaw);
		if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
			return fail(400, { error: "Chapter number must be a positive whole number" });
		}

		const title = titleRaw && String(titleRaw).trim() !== "" ? String(titleRaw).trim() : null;

		let partId = await findPart(item.id, "chapter", chapterNumber, null);
		if (!partId) {
			partId = await db.transaction((tx) =>
				createPart(tx, {
					mediaItemId: item.id,
					parentPartId: null,
					partType: "chapter",
					partNumber: chapterNumber,
					title,
					releaseDate: null,
					metadata: {},
				}),
			);
		}

		redirect(303, `/media/${params.slug}/part/${partId}/log?returnTo=${encodeURIComponent(returnTo)}`);
	},
};
