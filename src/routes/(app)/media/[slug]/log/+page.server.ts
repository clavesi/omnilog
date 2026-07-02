import { error, fail, redirect } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, mediaItems } from "$lib/server/db/schema";
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
			mediaType: mediaItems.mediaType,
		})
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");

	// Has the user logged this before? Drives the "logging again" header.
	const priorLogs = await db
		.select({ id: logs.id, loggedAt: logs.loggedAt })
		.from(logs)
		.where(and(eq(logs.userId, user.id), eq(logs.mediaItemId, item.id)))
		.orderBy(desc(logs.loggedAt))
		.limit(1);

	return {
		item,
		hasPriorLog: priorLogs.length > 0,
		today: new Date().toISOString().slice(0, 10),
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const form = await request.formData();
		const ratingRaw = form.get("rating");
		const loggedAtRaw = form.get("loggedAt");
		const reviewBodyRaw = form.get("reviewBody");
		const reviewTitleRaw = form.get("reviewTitle");
		const containsSpoilers = form.get("containsSpoilers") === "on";

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);

		if (!item) return fail(404, { error: "Media not found" });

		// Parse rating: empty = null, otherwise must be 1-10
		let rating: number | null = null;
		if (ratingRaw && ratingRaw !== "") {
			const n = Number(ratingRaw);
			if (!Number.isInteger(n) || n < 1 || n > 10) {
				return fail(400, { error: "Rating must be between 1 and 10" });
			}
			rating = n;
		}

		// Parse loggedAt: empty = null, otherwise YYYY-MM-DD, not in the future
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

		// Review fields: empty body = no review at all
		const reviewBody = reviewBodyRaw && String(reviewBodyRaw).trim() !== "" ? String(reviewBodyRaw).trim() : null;
		const reviewTitle =
			reviewBody && reviewTitleRaw && String(reviewTitleRaw).trim() !== "" ? String(reviewTitleRaw).trim() : null;

		// Need at least one meaningful field
		if (rating === null && reviewBody === null && loggedAt === null) {
			return fail(400, { error: "Add a rating, review, or date to log" });
		}

		// Rewatch check
		const prior = await db
			.select({ id: logs.id })
			.from(logs)
			.where(and(eq(logs.userId, user.id), eq(logs.mediaItemId, item.id)))
			.limit(1);
		const isRewatch = prior.length > 0;

		await db.insert(logs).values({
			userId: user.id,
			mediaItemId: item.id,
			mediaPartId: null,
			loggedAt,
			rating,
			reviewTitle,
			reviewBody,
			containsSpoilers: containsSpoilers && reviewBody !== null,
			isRewatch,
		});

		await recomputeAggregate(item.id);

		redirect(303, `/media/${params.slug}`);
	},
};

async function recomputeAggregate(mediaItemId: string) {
	const rated = await db.select({ rating: logs.rating }).from(logs).where(eq(logs.mediaItemId, mediaItemId));

	const values = rated.map((r) => r.rating).filter((r): r is number => r !== null);
	const count = values.length;
	const avg = count > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / count) : null;

	await db
		.update(mediaItems)
		.set({
			averageRating: avg?.toString(),
			ratingCount: count,
			updatedAt: new Date(),
		})
		.where(eq(mediaItems.id, mediaItemId));
}
