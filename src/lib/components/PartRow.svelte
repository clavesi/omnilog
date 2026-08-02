<script lang="ts">
type Props = {
	id: string;
	number: number | null;
	title: string | null;
	/** Optional subtitle line — release date, duration, etc. */
	subtitle?: string | null;
	averageRating: string | null;
	ratingCount: number;
	/** href to the existing log's edit page, or null if not yet logged. */
	existingLogId: string | null;
	mediaSlug: string;
	returnTo: string;
};

let { id, number, title, subtitle, averageRating, ratingCount, existingLogId, mediaSlug, returnTo }: Props = $props();

const logHref = $derived(
	existingLogId
		? `/media/${mediaSlug}/part/${id}/log/${existingLogId}/edit?returnTo=${encodeURIComponent(returnTo)}`
		: `/media/${mediaSlug}/part/${id}/log?returnTo=${encodeURIComponent(returnTo)}`,
);
</script>

<li class="flex items-center justify-between gap-4 py-4">
	<div class="flex min-w-0 items-start gap-3">
		<span class="mt-0.5 shrink-0 font-mono text-sm text-text-muted">
			{number !== null ? String(number).padStart(2, "0") : "—"}
		</span>
		<div class="min-w-0">
			<a href="/media/{mediaSlug}/part/{id}" class="m-0 font-display font-medium text-text no-underline hover:text-accent">
				{title}
			</a>
			{#if subtitle}
				<p class="m-0 mt-0.5 font-mono text-sm text-text-muted">{subtitle}</p>
			{/if}
			{#if averageRating}
				<p class="m-0 mt-0.5 font-mono text-sm text-text">★ {averageRating} ({ratingCount})</p>
			{/if}
		</div>
	</div>
	<a
		href={logHref}
		class="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
	>
		{existingLogId ? "Edit" : "Log"}
	</a>
</li>
