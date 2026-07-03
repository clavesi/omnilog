import { error, fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, mediaItems } from "$lib/server/db/schema";
import { recomputeAggregate } from "$lib/server/media-aggregate";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const { params } = event;

	const [item] = await db
		.select({
			id: mediaItems.id,
			slug: mediaItems.slug,
			title: mediaItems.title,
			coverImageUrl: mediaItems.coverImageUrl,
			releaseDate: mediaItems.releaseDate,
		})
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Media not found");

	const [existingLog] = await db.select().from(logs).where(eq(logs.id, params.logId)).limit(1);

	if (!existingLog) throw error(404, "Log not found");
	if (existingLog.userId !== user.id) throw error(403, "Not your log");

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

		const [existingLog] = await db
			.select({ id: logs.id, userId: logs.userId, mediaItemId: logs.mediaItemId })
			.from(logs)
			.where(eq(logs.id, params.logId))
			.limit(1);

		if (!existingLog) return fail(404, { error: "Log not found" });
		if (existingLog.userId !== user.id) return fail(403, { error: "Not your log" });

		const form = await request.formData();
		const ratingRaw = form.get("rating");
		const loggedAtRaw = form.get("loggedAt");
		const reviewBodyRaw = form.get("reviewBody");
		const reviewTitleRaw = form.get("reviewTitle");
		const containsSpoilers = form.get("containsSpoilers") === "on";
		const isPublic = form.get("isPublic") === "on";

		let rating: number | null = null;
		if (ratingRaw && ratingRaw !== "") {
			const n = Number(ratingRaw);
			if (!Number.isInteger(n) || n < 1 || n > 10) {
				return fail(400, { error: "Rating must be between 1 and 10" });
			}
			rating = n;
		}

		let loggedAt: string | null = null;
		if (loggedAtRaw && loggedAtRaw !== "") {
			const s = String(loggedAtRaw);
			if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
				return fail(400, { error: "Invalid date" });
			}
			const today = new Date().toISOString().slice(0, 10);
			if (s > today) {
				return fail(400, { error: "Log date can't be in the future" });
			}
			loggedAt = s;
		}

		const reviewBody = reviewBodyRaw && String(reviewBodyRaw).trim() !== "" ? String(reviewBodyRaw).trim() : null;
		const reviewTitle =
			reviewBody && reviewTitleRaw && String(reviewTitleRaw).trim() !== "" ? String(reviewTitleRaw).trim() : null;

		if (rating === null && reviewBody === null && loggedAt === null) {
			return fail(400, { error: "Add a rating, review, or date to log" });
		}

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
