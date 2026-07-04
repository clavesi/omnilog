<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";
import { isMetadataType } from "$lib/media-types";

let { data } = $props();

const item = $derived(data.item);
const metadata = $derived(data.metadata);
const genres = $derived(data.genres);
const year = $derived(item.releaseDate ? item.releaseDate.slice(0, 4) : null);
const averageRatingNum = $derived(item.averageRating != null ? Number.parseFloat(item.averageRating) : NaN);

let deletedLogIds = $state(new Set<string>());
const visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}
</script>

<article class="mx-auto my-8 max-w-[900px] px-4">
	{#if item.backdropImageUrl}
		<div
			class="mb-6 h-60 rounded-lg bg-cover bg-center"
			style="background-image: url({item.backdropImageUrl})"
		></div>
	{/if}

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
		{#if item.coverImageUrl}
			<img class="w-full rounded-lg sm:max-w-[200px]" src={item.coverImageUrl} alt="" />
		{/if}

		<div>
			<h1 class="mb-2">
				{item.title}
				{#if year}
					<span class="font-normal text-gray-500">({year})</span>{/if}
			</h1>

			{#if metadata && isMetadataType(metadata, "movie") && metadata.tagline}
				<p class="mb-4 text-gray-500 italic">{metadata.tagline}</p>
			{/if}

			<ul class="m-0 mb-3 flex list-none flex-wrap gap-4 p-0 text-sm text-gray-500">
				<li class="rounded bg-gray-200 px-2 py-0.5 capitalize">{item.mediaType}</li>

				{#if metadata && isMetadataType(metadata, "movie") && metadata.runtime}
					<li>{metadata.runtime} min</li>
				{/if}

				{#if metadata && isMetadataType(metadata, "tv")}
					{#if metadata.number_of_seasons}
						<li>
							{metadata.number_of_seasons} season{metadata.number_of_seasons === 1
								? ""
								: "s"}
						</li>
					{/if}
					{#if metadata.number_of_episodes}
						<li>
							{metadata.number_of_episodes} episode{metadata.number_of_episodes === 1
								? ""
								: "s"}
						</li>
					{/if}
					{#if metadata.status}
						<li>{metadata.status}</li>
					{/if}
				{/if}

				{#if metadata && isMetadataType(metadata, "game")}
					{#if metadata.platforms.length}
						<li>{metadata.platforms.join(", ")}</li>
					{/if}
					{#if metadata.developers.length}
						<li>Dev: {metadata.developers.join(", ")}</li>
					{/if}
					{#if metadata.publishers.length && metadata.publishers.join() !== metadata.developers.join()}
						<li>Pub: {metadata.publishers.join(", ")}</li>
					{/if}
					{#if metadata.game_modes.length}
						<li>{metadata.game_modes.join(", ")}</li>
					{/if}
				{/if}

				{#if Number.isFinite(averageRatingNum)}
					<li class="font-medium text-gray-800">
						★ {(averageRatingNum / 2).toFixed(1)} ({item.ratingCount}
						rating{item.ratingCount === 1 ? "" : "s"})
					</li>
				{/if}
			</ul>

			{#if genres.length}
				<ul class="m-0 mb-4 flex list-none flex-wrap gap-2 p-0">
					{#each genres as g (g.slug)}
						<li class="rounded-full bg-gray-100 px-2.5 py-1 text-[0.8125rem] text-gray-700">{g.name}</li>
					{/each}
				</ul>
			{/if}

			{#if item.description}
				<p class="mb-6 leading-relaxed">{item.description}</p>
			{/if}

			<div>
				<a
					href="/media/{item.slug}/log"
					class="inline-block cursor-pointer rounded-lg border-none bg-blue-600 px-6 py-3 text-base text-white no-underline hover:bg-blue-700"
				>
					Log this
				</a>
			</div>

			<section class="mt-12 border-t border-gray-200 pt-6">
				<h2 class="mb-4 text-lg">Logs & Reviews</h2>
				{#if visibleLogs.length === 0}
					<p class="text-gray-500">No one has logged this yet. Be the first!</p>
				{:else}
					{#each visibleLogs as log (log.id)}
						<LogCard
							{log}
							showMediaInfo={false}
							showAuthor={true}
							isOwner={data.currentUserId === log.userId}
							onDelete={handleDeleted}
						/>
					{/each}
				{/if}
			</section>
		</div>
	</div>
</article>