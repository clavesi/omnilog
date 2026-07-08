import { error, fail, redirect } from "@sveltejs/kit";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, mediaItems, mediaParts } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

// Only allow redirecting to a same-site relative path — same guard used
// on the login/signup returnTo handling.
function safeReturnPath(raw: string | null, fallback: string): string {
	if (!raw) return fallback;
	if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
	return raw;
}

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const { params, url } = event;

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

	const priorLogs = await db
		.select({ id: logs.id })
		.from(logs)
		.where(and(eq(logs.userId, user.id), eq(logs.mediaPartId, part.id)))
		.orderBy(desc(logs.createdAt))
		.limit(1);

	const returnTo = safeReturnPath(
		url.searchParams.get("returnTo"),
		`/media/${params.slug}/part/${params.partId}`,
	);

	return {
		item,
		part,
		hasPriorLog: priorLogs.length > 0,
		today: new Date().toISOString().slice(0, 10),
		returnTo,
	};
};

export const actions: Actions = {
	default: async (event) => {
		const user = requireUser(event);
		const { request, params } = event;

		const [part] = await db.select().from(mediaParts).where(eq(mediaParts.id, params.partId)).limit(1);
		if (!part) return fail(404, { error: "Part not found" });

		const form = await request.formData();
		const returnTo = safeReturnPath(
			form.get("returnTo") as string | null,
			`/media/${params.slug}/part/${params.partId}`,
		);
		const ratingRaw = form.get("rating");
		const loggedAtRaw = form.get("loggedAt");
		const reviewBodyRaw = form.get("reviewBody");
		const reviewTitleRaw = form.get("reviewTitle");
		const containsSpoilers = form.get("containsSpoilers") === "on";

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
			if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return fail(400, { error: "Invalid date" });
			const today = new Date().toISOString().slice(0, 10);
			if (s > today) return fail(400, { error: "Log date can't be in the future" });
			loggedAt = s;
		}

		const reviewBody = reviewBodyRaw && String(reviewBodyRaw).trim() !== "" ? String(reviewBodyRaw).trim() : null;
		const reviewTitle =
			reviewBody && reviewTitleRaw && String(reviewTitleRaw).trim() !== "" ? String(reviewTitleRaw).trim() : null;

		if (rating === null && reviewBody === null && loggedAt === null) {
			return fail(400, { error: "Add a rating, review, or date to log" });
		}

		const prior = await db
			.select({ id: logs.id })
			.from(logs)
			.where(and(eq(logs.userId, user.id), eq(logs.mediaPartId, part.id)))
			.limit(1);
		const isRewatch = prior.length > 0;

		await db.insert(logs).values({
			userId: user.id,
			mediaItemId: null,
			mediaPartId: part.id,
			loggedAt,
			rating,
			reviewTitle,
			reviewBody,
			containsSpoilers: containsSpoilers && reviewBody !== null,
			isRewatch,
			isPublic: form.get("isPublic") === "on",
		});

		// No aggregate recompute here — media_parts doesn't have
		// averageRating/ratingCount columns yet (tracked as a follow-up).

		redirect(303, returnTo);
	},
};
