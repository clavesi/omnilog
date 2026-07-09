/**
 * Shared validation for log create/edit form actions.
 * Keeps the four route handlers in sync on rating, date, and review rules.
 */

export type LogFormFields = {
	rating: number | null;
	loggedAt: string | null;
	reviewBody: string | null;
	reviewTitle: string | null;
	containsSpoilers: boolean;
	isPublic: boolean;
};

export type ParseLogFormResult = { ok: true; fields: LogFormFields } | { ok: false; error: string };

export function parseLogFormData(form: FormData): ParseLogFormResult {
	const ratingRaw = form.get("rating");
	const loggedAtRaw = form.get("loggedAt");
	const reviewBodyRaw = form.get("reviewBody");
	const reviewTitleRaw = form.get("reviewTitle");
	const containsSpoilers = form.get("containsSpoilers") === "on";
	const isPublic = form.get("isPublic") === "on";

	// Empty rating/date fields mean "not set" — logs can be review-only or date-only.
	let rating: number | null = null;
	if (ratingRaw && ratingRaw !== "") {
		const n = Number(ratingRaw);
		if (!Number.isInteger(n) || n < 1 || n > 10) {
			return { ok: false, error: "Rating must be between 1 and 10" };
		}
		rating = n;
	}

	let loggedAt: string | null = null;
	if (loggedAtRaw && loggedAtRaw !== "") {
		const s = String(loggedAtRaw);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
			return { ok: false, error: "Invalid date" };
		}
		const today = new Date().toISOString().slice(0, 10);
		if (s > today) {
			return { ok: false, error: "Log date can't be in the future" };
		}
		loggedAt = s;
	}

	const reviewBody = reviewBodyRaw && String(reviewBodyRaw).trim() !== "" ? String(reviewBodyRaw).trim() : null;
	// Title is only stored when there's a review body — avoids orphan titles.
	const reviewTitle =
		reviewBody && reviewTitleRaw && String(reviewTitleRaw).trim() !== "" ? String(reviewTitleRaw).trim() : null;

	if (rating === null && reviewBody === null && loggedAt === null) {
		return { ok: false, error: "Add a rating, review, or date to log" };
	}

	return {
		ok: true,
		fields: { rating, loggedAt, reviewBody, reviewTitle, containsSpoilers, isPublic },
	};
}
