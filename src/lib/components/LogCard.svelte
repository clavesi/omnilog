<script lang="ts">
import { fade } from "svelte/transition";
import { getMediaTypeColor } from "$lib/media-type-colors";
import { formatPartLabel } from "$lib/part-label";
import type { LogCardData } from "$lib/types/log";
import { formatWatchLabel } from "$lib/watch-label";
import MediaTypeMark from "./MediaTypeMark.svelte";
import StaticStars from "./StaticStars.svelte";

/**
 * Log card used across feed, profiles, and media/part pages.
 * Callers tune context via props — e.g. feed shows author + media, part page
 * hides media (you're already on the episode) but shows author.
 */
type Props = {
	log: LogCardData;
	showMediaInfo?: boolean;
	showAuthor?: boolean;
	isOwner?: boolean;
	returnTo?: string;
	onDelete?: (logId: string) => void;
};

let { log, showMediaInfo = true, showAuthor = false, isOwner = false, returnTo, onDelete }: Props = $props();

let revealSpoilers = $state(false);

const displayDate = $derived.by(() => {
	// loggedAt is user-editable; fall back to createdAt for older logs without a date.
	const d = log.loggedAt ?? (typeof log.createdAt === "string" ? log.createdAt : log.createdAt.toISOString());
	return new Date(d).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
});

let deleting = $state(false);

async function handleDelete() {
	if (!confirm("Delete this log? This can't be undone.")) return;
	deleting = true;
	try {
		const res = await fetch(`/api/logs/${log.id}`, {
			method: "DELETE",
		});
		if (res.ok) {
			onDelete?.(log.id);
		} else {
			alert("Failed to delete log");
		}
	} finally {
		deleting = false;
	}
}

const editHref = $derived.by(() => {
	const base = log.mediaPartId
		? `/media/${log.mediaSlug}/part/${log.mediaPartId}/log/${log.id}/edit`
		: `/media/${log.mediaSlug}/log/${log.id}/edit`;

	if (returnTo) {
		return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
	}

	return base;
});

const partHref = $derived(log.mediaPartId ? `/media/${log.mediaSlug}/part/${log.mediaPartId}` : null);

const partLabel = $derived(
	log.mediaPartId && log.partNumber != null
		? formatPartLabel({
				seasonNumber: log.seasonNumber,
				partNumber: log.partNumber,
				title: log.partTitle,
			})
		: null,
);

const watchLabel = $derived(formatWatchLabel(log.watchNumber, log.isRewatch));
const typeColor = $derived(log.mediaType ? getMediaTypeColor(log.mediaType) : null);
</script>

<article
	class="animate-fade-up mb-4 rounded-md border border-border bg-bg p-5 transition-opacity duration-200 last:mb-0"
	class:opacity-50={deleting}
>
	<div class="flex gap-4">
		{#if showMediaInfo}
			<a
				href={partHref ?? `/media/${log.mediaSlug}`}
				class="group/cover flex shrink-0 gap-1.5 no-underline"
				style={typeColor ? `--type-color: ${typeColor}` : undefined}
			>
				{#if log.mediaType}
					<MediaTypeMark mediaType={log.mediaType} variant="tab" />
				{/if}
				{#if log.mediaCoverUrl}
					<img
						src={log.mediaCoverUrl}
						alt=""
						class="cover-hover h-[69px] w-[46px] rounded-sm bg-surface object-cover group-hover/cover:shadow-[0_0_0_1px_var(--type-color)]"
					/>
				{:else}
					<div
						class="cover-hover h-[69px] w-[46px] rounded-sm bg-surface group-hover/cover:shadow-[0_0_0_1px_var(--type-color)]"
					></div>
				{/if}
			</a>
		{/if}

		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2.5">
				{#if showMediaInfo}
					{#if partLabel && partHref}
						<a
							href={partHref}
							class="font-display text-[1.0625rem] font-semibold text-text no-underline transition-colors hover:text-accent"
						>
							{partLabel}
						</a>
					{:else}
						<a
							href="/media/{log.mediaSlug}"
							class="font-display text-[1.0625rem] font-semibold text-text no-underline transition-colors hover:text-accent"
						>
							{log.mediaTitle}
						</a>
					{/if}
				{/if}
				{#if showAuthor && log.username}
					<a href="/u/{log.username}" class="link-soft text-sm">
						{log.username}
					</a>
				{/if}
				{#if log.rating !== null}
					<StaticStars value={log.rating} size={16} />
				{/if}
				{#if watchLabel}
					<span
						class="rounded-sm border border-border px-2 py-0.5 font-mono text-[0.6875rem] text-text-muted"
					>
						{watchLabel}
					</span>
				{/if}
				{#if isOwner && !log.isPublic}
					<span
						class="rounded-sm border border-border px-2 py-0.5 font-mono text-[0.6875rem] text-text-muted"
					>
						Private
					</span>
				{/if}
			</div>

			{#if showMediaInfo && partLabel && partHref}
				<a
					href="/media/{log.mediaSlug}"
					class="mt-0.5 block text-sm text-text-muted no-underline transition-colors hover:text-text"
				>
					{log.mediaTitle}
				</a>
			{/if}

			<time class="mt-1 block font-mono text-[0.8125rem] text-text-muted">{displayDate}</time>

			{#if log.reviewBody}
				<div class="mt-3">
					{#if log.reviewTitle}
						<h3 class="mb-1 font-display text-[0.9375rem]">{log.reviewTitle}</h3>
					{/if}

					{#if log.containsSpoilers && !revealSpoilers}
						<button
							type="button"
							class="cursor-pointer rounded-sm border border-dashed border-border bg-surface px-3 py-2 text-sm text-text-muted transition-colors duration-200 hover:border-text-muted hover:text-text"
							onclick={() => (revealSpoilers = true)}
						>
							Contains spoilers — click to reveal
						</button>
					{:else if log.containsSpoilers}
						<p
							class="m-0 leading-relaxed whitespace-pre-wrap text-text"
							in:fade={{ duration: 200 }}
						>
							{log.reviewBody}
						</p>
					{:else}
						<p class="m-0 leading-relaxed whitespace-pre-wrap text-text">
							{log.reviewBody}
						</p>
					{/if}
				</div>
			{/if}

			{#if isOwner}
				<div class="mt-3 flex gap-4 text-[0.8125rem]">
					<a href={editHref} class="link-soft">
						Edit
					</a>

					<button
						type="button"
						class="cursor-pointer border-none bg-transparent p-0 text-[0.8125rem] text-danger transition-opacity duration-200 hover:opacity-80"
						onclick={handleDelete}
						disabled={deleting}
					>
						{deleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			{/if}
		</div>
	</div>
</article>
