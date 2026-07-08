<script lang="ts">
let { data } = $props();
</script>

<main class="mx-auto my-8 max-w-[700px] px-4">
	<p class="mb-1 text-sm text-gray-500">
		<a href="/media/{data.item.slug}" class="text-blue-600 hover:underline">{data.item.title}</a>
	</p>
	<h1 class="mb-6 text-xl font-semibold">Season {data.seasonNumber}</h1>

	{#if data.episodes.length === 0}
		<p class="text-gray-500">No episodes found for this season.</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-gray-200 p-0">
			{#each data.episodes as ep (ep.id)}
				<li class="flex items-center justify-between gap-4 py-3">
					<div class="min-w-0">
                    <a
						href="/media/{data.item.slug}/part/{ep.id}"
                        class="m-0 font-medium text-inherit no-underline hover:underline"
                    >
                        {ep.number}. {ep.title}
                    </a>
						{#if ep.releaseDate}
							<p class="m-0 text-sm text-gray-500">{ep.releaseDate}</p>
						{/if}
					</div>
					<a
						href={ep.existingLogId
							? `/media/${data.item.slug}/part/${ep.id}/log/${ep.existingLogId}/edit?returnTo=${encodeURIComponent(`/media/${data.item.slug}/season/${data.seasonNumber}`)}`
							: `/media/${data.item.slug}/part/${ep.id}/log?returnTo=${encodeURIComponent(`/media/${data.item.slug}/season/${data.seasonNumber}`)}`}
						class="shrink-0 rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 no-underline hover:bg-gray-200"
					>
						{ep.existingLogId ? "Edit log" : "Log"}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>