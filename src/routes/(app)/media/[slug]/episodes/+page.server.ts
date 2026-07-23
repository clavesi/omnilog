import { error, fail } from "@sveltejs/kit";
import { and, eq, inArray } from "drizzle-orm";
import { requireAdmin } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { logs, mediaItems, mediaParts } from "$lib/server/db/schema";
import { importAnimeEpisodes } from "$lib/server/jikan";
import { createPart, findFlatParts, type PartType } from "$lib/server/parts";
import type { Actions, PageServerLoad } from "./$types";

type EpisodeDisplay = {
	id: string;
	number: number | null;
	title: string | null;
	releaseDate: string | null;
	isFiller: boolean;
	averageRating: string | null;
	ratingCount: number;
	existingLogId: string | null;
	sagaId: string | null;
	arcId: string | null;
};

type EpisodeRange = { start: number; end: number };
type RangeMetadata = { ranges: EpisodeRange[]; isFiller?: boolean };
type RangePart = { id: string; title: string | null; ranges: EpisodeRange[]; isFiller: boolean };

/**
 * Arcs/sagas aren't always one contiguous block — e.g. One Piece's
 * Loguetown Arc is episodes 45 and 48-53, with the Buggy Side Story Arc
 * (46-47) nested inside that span. So each part stores a LIST of ranges,
 * not a single start/end pair, entered as text like "45, 48-53".
 */
const TIERS = { arc: "arc", saga: "saga" } as const satisfies Record<string, PartType>;
type Tier = keyof typeof TIERS;

function episodeInRanges(num: number, ranges: EpisodeRange[]): boolean {
	return ranges.some((r) => num >= r.start && num <= r.end);
}

function rangesOverlap(a: EpisodeRange, b: EpisodeRange): boolean {
	return a.start <= b.end && a.end >= b.start;
}

function anyRangeOverlap(a: EpisodeRange[], b: EpisodeRange[]): boolean {
	return a.some((ra) => b.some((rb) => rangesOverlap(ra, rb)));
}

function minStart(ranges: EpisodeRange[]): number {
	return Math.min(...ranges.map((r) => r.start));
}

/**
 * Parses "45, 48-53" style input into structured ranges. Rejects if the
 * ranges given overlap EACH OTHER within the same submission (ambiguous —
 * just re-enter as a single merged range instead), or if the syntax is
 * invalid.
 */
function parseEpisodeRangesInput(input: string): EpisodeRange[] | { error: string } {
	const parts = input
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (parts.length === 0) return { error: "Enter at least one episode or range, e.g. 45, 48-53" };

	const ranges: EpisodeRange[] = [];
	for (const part of parts) {
		const match = part.match(/^(\d+)(?:-(\d+))?$/);
		if (!match) return { error: `"${part}" isn't a valid episode or range (use e.g. "45" or "48-53")` };
		const start = Number(match[1]);
		const end = match[2] ? Number(match[2]) : start;
		if (end < start) return { error: `"${part}": end must be >= start` };
		ranges.push({ start, end });
	}

	for (let i = 0; i < ranges.length; i++) {
		for (let j = i + 1; j < ranges.length; j++) {
			if (rangesOverlap(ranges[i], ranges[j])) {
				return { error: "The ranges you entered overlap each other — merge them into one range instead" };
			}
		}
	}

	return ranges;
}

function formatEpisodeRanges(ranges: EpisodeRange[]): string {
	return [...ranges]
		.sort((a, b) => a.start - b.start)
		.map((r) => (r.start === r.end ? String(r.start) : `${r.start}-${r.end}`))
		.join(", ");
}

/**
 * Groups a list of numbered items into contiguous display segments by
 * range match. Because a part's ranges can be interrupted (Loguetown
 * example above), the SAME part can legitimately produce more than one
 * segment in the walk below — that's intentional, not a bug: episode 45
 * shows under "Loguetown", 46-47 shows under "Buggy Side Story", then
 * 48-53 shows under "Loguetown" again. That's the correct representation
 * of a story that's genuinely interrupted, not resumed-and-merged.
 */
function groupByRanges<T extends { number: number | null }>(
	items: T[],
	parts: RangePart[],
): { partId: string | null; label: string | null; isFiller: boolean; items: T[] }[] {
	const segments: { partId: string | null; label: string | null; isFiller: boolean; items: T[] }[] = [];

	for (const item of items) {
		const num = item.number;
		const match = num !== null ? parts.find((p) => episodeInRanges(num, p.ranges)) : undefined;
		const key = match?.id ?? null;

		const last = segments[segments.length - 1];
		if (last && last.partId === key) {
			last.items.push(item);
		} else {
			segments.push({ partId: key, label: match?.title ?? null, isFiller: match?.isFiller ?? false, items: [item] });
		}
	}

	return segments;
}

function toRangeParts(parts: { id: string; title: string | null; metadata: unknown }[]): RangePart[] {
	return parts
		.map((p) => {
			const meta = p.metadata as Partial<RangeMetadata>;
			if (!Array.isArray(meta.ranges) || meta.ranges.length === 0) return null;
			return { id: p.id, title: p.title, ranges: meta.ranges, isFiller: meta.isFiller ?? false };
		})
		.filter((p): p is RangePart => p !== null)
		.sort((a, b) => minStart(a.ranges) - minStart(b.ranges));
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const [item] = await db
		.select({ id: mediaItems.id, slug: mediaItems.slug, title: mediaItems.title, mediaType: mediaItems.mediaType })
		.from(mediaItems)
		.where(eq(mediaItems.slug, params.slug))
		.limit(1);

	if (!item) throw error(404, "Not found");
	if (item.mediaType !== "anime") throw error(400, "Not an anime");

	const episodes = await importAnimeEpisodes(item.id);
	const arcParts = await findFlatParts(item.id, "arc");
	const sagaParts = await findFlatParts(item.id, "saga");

	const loggedPartLogIds = new Map<string, string>();
	if (locals.user && episodes.length > 0) {
		const userLogs = await db
			.select({ id: logs.id, mediaPartId: logs.mediaPartId })
			.from(logs)
			.where(
				and(
					eq(logs.userId, locals.user.id),
					inArray(
						logs.mediaPartId,
						episodes.map((e) => e.id),
					),
				),
			);
		for (const l of userLogs) {
			if (l.mediaPartId) loggedPartLogIds.set(l.mediaPartId, l.id);
		}
	}

	const episodeDisplays: EpisodeDisplay[] = episodes.map((e) => ({
		id: e.id,
		number: e.partNumber,
		title: e.title,
		releaseDate: e.releaseDate,
		isFiller: (e.metadata as { filler?: boolean })?.filler ?? false,
		averageRating: e.averageRating,
		ratingCount: e.ratingCount,
		existingLogId: loggedPartLogIds.get(e.id) ?? null,
		sagaId: null,
		arcId: null,
	}));

	const arcs = toRangeParts(arcParts);
	const sagas = toRangeParts(sagaParts);

	// Top-level pass groups by saga; nested pass re-groups each resulting
	// saga segment by arc. Zero sagas defined -> exactly one top-level
	// segment covering everything, so the arc grouping underneath renders
	// identically to how it did before sagas existed.
	const sagaSegments = groupByRanges(episodeDisplays, sagas);
	const nestedSegments = sagaSegments.map((seg) => ({
		sagaId: seg.partId,
		sagaLabel: seg.label,
		sagaIsFiller: seg.isFiller,
		arcSegments: groupByRanges(seg.items, arcs),
	}));

	// Tag each episode with which saga/arc it landed in, so the client can
	// filter to "just this saga" or "just this arc" without needing to
	// redo the range-matching logic itself.
	for (const sagaSeg of nestedSegments) {
		for (const arcSeg of sagaSeg.arcSegments) {
			for (const ep of arcSeg.items) {
				ep.sagaId = sagaSeg.sagaId;
				ep.arcId = arcSeg.partId;
			}
		}
	}

	return {
		item,
		currentUserId: locals.user?.id ?? null,
		isAdmin: locals.user?.isAdmin ?? false,
		episodes: episodeDisplays,
		arcs: arcs.map((a) => ({
			id: a.id,
			title: a.title,
			rangesText: formatEpisodeRanges(a.ranges),
			isFiller: a.isFiller,
		})),
		sagas: sagas.map((s) => ({
			id: s.id,
			title: s.title,
			rangesText: formatEpisodeRanges(s.ranges),
			isFiller: s.isFiller,
		})),
		segments: nestedSegments,
	};
};

export const actions: Actions = {
	addTier: async (event) => {
		requireAdmin(event);
		const { request, params } = event;
		const tier = await requireTier(request);
		if ("error" in tier) return fail(400, { error: tier.error });

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.slug, params.slug))
			.limit(1);
		if (!item) return fail(404, { error: "Anime not found" });

		const title = String(tier.form.get("title") ?? "").trim();
		if (!title) return fail(400, { error: "Name is required" });

		const ranges = parseEpisodeRangesInput(String(tier.form.get("episodes") ?? ""));
		if ("error" in ranges) return fail(400, { error: ranges.error });

		const isFiller = tier.form.get("isFiller") === "on";

		const existing = await findFlatParts(item.id, TIERS[tier.tier]);
		const overlap = findOverlappingPart(toRangeParts(existing), ranges);
		if (overlap) return fail(400, { error: overlapMessage(tier.tier, overlap) });

		await db.transaction((tx) =>
			createPart(tx, {
				mediaItemId: item.id,
				parentPartId: null,
				partType: TIERS[tier.tier],
				partNumber: minStart(ranges), // just needs to be stable; display order comes from metadata, not this
				title,
				releaseDate: null,
				metadata: { ranges, isFiller },
			}),
		);

		return { success: true };
	},

	editTier: async (event) => {
		requireAdmin(event);
		const { request, params } = event;
		const tier = await requireTier(request);
		if ("error" in tier) return fail(400, { error: tier.error });

		const partId = String(tier.form.get("partId") ?? "");
		if (!partId) return fail(400, { error: "Missing id" });

		const [part] = await db.select().from(mediaParts).where(eq(mediaParts.id, partId)).limit(1);
		if (part?.partType !== TIERS[tier.tier]) return fail(404, { error: "Not found" });

		const [item] = await db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(and(eq(mediaItems.slug, params.slug), eq(mediaItems.id, part.mediaItemId)))
			.limit(1);
		if (!item) return fail(404, { error: "Anime not found" });

		const title = String(tier.form.get("title") ?? "").trim();
		if (!title) return fail(400, { error: "Name is required" });

		const ranges = parseEpisodeRangesInput(String(tier.form.get("episodes") ?? ""));
		if ("error" in ranges) return fail(400, { error: ranges.error });

		const isFiller = tier.form.get("isFiller") === "on";

		const existing = await findFlatParts(item.id, TIERS[tier.tier]);
		const overlap = findOverlappingPart(toRangeParts(existing), ranges, partId);
		if (overlap) return fail(400, { error: overlapMessage(tier.tier, overlap) });

		await db
			.update(mediaParts)
			.set({
				title,
				partNumber: minStart(ranges),
				metadata: { ranges, isFiller },
				updatedAt: new Date(),
			})
			.where(eq(mediaParts.id, partId));

		return { success: true };
	},

	deleteTier: async (event) => {
		requireAdmin(event);
		const { request } = event;

		const form = await request.formData();
		const partId = String(form.get("partId") ?? "");
		if (!partId) return fail(400, { error: "Missing id" });

		const [part] = await db.select({ id: mediaParts.id }).from(mediaParts).where(eq(mediaParts.id, partId)).limit(1);
		if (!part) return fail(404, { error: "Not found" });

		// Deleting a saga or arc never touches its episodes — they're
		// independent rows, not children. They just fall back to ungrouped
		// display automatically.
		await db.delete(mediaParts).where(eq(mediaParts.id, partId));

		return { success: true };
	},
};

// ============================================================================
// Shared saga/arc helpers
// ============================================================================

async function requireTier(request: Request): Promise<{ tier: Tier; form: FormData } | { error: string }> {
	const form = await request.formData();
	const raw = String(form.get("tier") ?? "");
	if (raw !== "arc" && raw !== "saga") return { error: "Invalid tier" };
	return { tier: raw, form };
}

/** excludeId lets edit check against every OTHER part of the same tier without flagging itself. */
function findOverlappingPart(parts: RangePart[], newRanges: EpisodeRange[], excludeId?: string): RangePart | undefined {
	return parts.find((p) => p.id !== excludeId && anyRangeOverlap(newRanges, p.ranges));
}

function overlapMessage(tier: Tier, overlap: RangePart): string {
	return `Overlaps with existing ${tier} "${overlap.title}" (episodes ${formatEpisodeRanges(overlap.ranges)})`;
}
