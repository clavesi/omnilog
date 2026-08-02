<script lang="ts">
import MediaGrid from "$lib/components/MediaGrid.svelte";
import { mediaTypeLabel } from "$lib/media-type-colors";

let { data } = $props();

const mediaTypes = ["movie", "tv", "game", "anime", "manga", "music", "book"] as const;

function filterHref(type: string | null): string {
	const base = `/browse/decade/${data.decadeLabel}`;
	if (!type) return base;
	return `${base}?type=${type}`;
}

function pageHref(p: number): string {
	const params = new URLSearchParams();
	if (data.mediaType) params.set("type", data.mediaType);
	if (p > 1) params.set("page", String(p));
	const qs = params.toString();
	return `/browse/decade/${data.decadeLabel}${qs ? `?${qs}` : ""}`;
}
</script>

<div>
	<header class="mb-8">
		<p class="m-0 mb-1 text-sm text-text-muted">
			<a href="/browse" class="link-soft">Browse</a> / Decade
		</p>
		<h1 class="m-0 font-display text-3xl tracking-tight sm:text-4xl">{data.decadeLabel}</h1>
		<p class="mt-2 font-mono text-sm text-text-muted">
			{data.total} item{data.total === 1 ? "" : "s"}
		</p>
	</header>

	<nav class="mb-8 flex flex-wrap gap-2" aria-label="Filter by media type">
		<a
			href={filterHref(null)}
			class="rounded-sm border px-2.5 py-1 text-sm no-underline transition-colors {data.mediaType === null
				? 'border-accent text-accent'
				: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
		>
			All
		</a>
		{#each mediaTypes as t (t)}
			<a
				href={filterHref(t)}
				class="rounded-sm border px-2.5 py-1 text-sm no-underline transition-colors {data.mediaType === t
					? 'border-accent text-accent'
					: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
			>
				{mediaTypeLabel(t)}
			</a>
		{/each}
	</nav>

	<MediaGrid items={data.items} />

	{#if data.totalPages > 1}
		<nav class="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
			{#if data.page > 1}
				<a
					href={pageHref(data.page - 1)}
					class="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
				>
					← Prev
				</a>
			{/if}
			<span class="font-mono text-sm text-text-muted">
				{data.page} / {data.totalPages}
			</span>
			{#if data.page < data.totalPages}
				<a
					href={pageHref(data.page + 1)}
					class="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
				>
					Next →
				</a>
			{/if}
		</nav>
	{/if}
</div>
