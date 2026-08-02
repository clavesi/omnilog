<script lang="ts">
import MediaBreadcrumb from "$lib/components/MediaBreadcrumb.svelte";
import PartRow from "$lib/components/PartRow.svelte";

let { data } = $props();

// svelte-ignore state_referenced_locally
const returnTo = `/media/${data.item.slug}/tracks`;
</script>

<div>
	<MediaBreadcrumb mediaType={data.item.mediaType} slug={data.item.slug} title={data.item.title} />
	<h1 class="mb-8 text-2xl">Tracks</h1>

	{#if data.tracks.length === 0}
		<p class="text-text-muted">No tracks found.</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-border p-0">
			{#each data.tracks as track (track.id)}
				<PartRow
					id={track.id}
					number={track.number}
					title={track.title}
					subtitle={track.duration}
					averageRating={track.averageRating}
					ratingCount={track.ratingCount}
					existingLogId={track.existingLogId}
					mediaSlug={data.item.slug}
					{returnTo}
				/>
			{/each}
		</ul>
	{/if}
</div>
