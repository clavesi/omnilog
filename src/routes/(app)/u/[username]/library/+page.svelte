<script lang="ts">
import MediaGrid from "$lib/components/MediaGrid.svelte";
import { formatProgress, MEDIA_STATUS_OPTIONS } from "$lib/media-status";

let { data } = $props();

// MediaGrid expects the media item shape; progress is surfaced separately
// below the grid heading rather than on each cover.
const items = $derived(
	data.entries.map((e) => ({
		slug: e.mediaItem.slug,
		title: e.mediaItem.title,
		mediaType: e.mediaItem.mediaType,
		releaseDate: e.mediaItem.releaseDate,
		coverImageUrl: e.mediaItem.coverImageUrl,
		averageRating: null,
		ratingCount: 0,
	})),
);

const withProgress = $derived(
	data.entries
		.map((e) => ({ title: e.mediaItem.title, label: formatProgress(e.mediaItem.mediaType, e.progress) }))
		.filter((e) => e.label !== null),
);
</script>

<div>
	<header class="mb-8">
		<p class="m-0 mb-1 text-sm text-text-muted">
			<a href="/u/{data.profileUser.username}" class="link-soft">{data.profileUser.username}</a>
		</p>
		<h1 class="m-0 font-display text-3xl tracking-tight sm:text-4xl">Library</h1>
	</header>

	<nav class="mb-8 flex flex-wrap gap-2" aria-label="Filter by status">
		{#each MEDIA_STATUS_OPTIONS as opt (opt.value)}
			<a
				href="/u/{data.profileUser.username}/library?status={opt.value}"
				class="rounded-sm border px-2.5 py-1 text-sm no-underline transition-colors {data.status === opt.value
					? 'border-accent text-accent'
					: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
			>
				{opt.label}
				<span class="ml-1 font-mono text-xs opacity-60">{data.counts[opt.value] ?? 0}</span>
			</a>
		{/each}
	</nav>

	{#if withProgress.length > 0}
		<ul class="m-0 mb-6 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-text-muted">
			{#each withProgress as p (p.title)}
				<li>{p.title} — {p.label}</li>
			{/each}
		</ul>
	{/if}

	<MediaGrid {items} />
</div>
