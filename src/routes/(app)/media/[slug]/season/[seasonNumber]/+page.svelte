<script lang="ts">
import MediaBreadcrumb from "$lib/components/MediaBreadcrumb.svelte";
import PartRow from "$lib/components/PartRow.svelte";

let { data } = $props();

// svelte-ignore state_referenced_locally
const returnTo = `/media/${data.item.slug}/season/${data.seasonNumber}`;
</script>

<div>
	<MediaBreadcrumb mediaType={data.item.mediaType} slug={data.item.slug} title={data.item.title} />
	<h1 class="mb-8 text-2xl">Season <span class="font-mono">{data.seasonNumber}</span></h1>

	{#if data.episodes.length === 0}
		<p class="text-text-muted">No episodes found for this season.</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-border p-0">
			{#each data.episodes as ep (ep.id)}
				<PartRow
					id={ep.id}
					number={ep.number}
					title={ep.title}
					subtitle={ep.releaseDate}
					averageRating={ep.averageRating}
					ratingCount={ep.ratingCount}
					existingLogId={ep.existingLogId}
					mediaSlug={data.item.slug}
					{returnTo}
				/>
			{/each}
		</ul>
	{/if}
</div>
