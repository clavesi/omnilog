<script lang="ts">
import MediaBreadcrumb from "$lib/components/MediaBreadcrumb.svelte";
import PartRow from "$lib/components/PartRow.svelte";

let { data } = $props();

// svelte-ignore state_referenced_locally
const returnTo = `/media/${data.item.slug}/dlc`;

function subtitleFor(kind: string, releaseYear: string | null): string {
	return releaseYear ? `${kind} · ${releaseYear}` : kind;
}
</script>

<div>
	<MediaBreadcrumb mediaType={data.item.mediaType} slug={data.item.slug} title={data.item.title} />
	<h1 class="mb-8 text-2xl">DLC &amp; Expansions</h1>

	{#if data.addOns.length === 0}
		<p class="text-text-muted">No DLC or expansions found for this game.</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-border p-0">
			{#each data.addOns as addOn (addOn.id)}
				<PartRow
					id={addOn.id}
					number={addOn.number}
					title={addOn.title}
					subtitle={subtitleFor(addOn.kind, addOn.releaseYear)}
					averageRating={addOn.averageRating}
					ratingCount={addOn.ratingCount}
					existingLogId={addOn.existingLogId}
					mediaSlug={data.item.slug}
					{returnTo}
				/>
			{/each}
		</ul>
	{/if}
</div>
