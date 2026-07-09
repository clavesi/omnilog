<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
const visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}

const backHref = $derived(
	data.season ? `/media/${data.item.slug}/season/${data.season.partNumber}` : `/media/${data.item.slug}/episodes`,
);

const partHref = $derived(`/media/${data.item.slug}/part/${data.part.id}`);

const logHref = $derived(`/media/${data.item.slug}/part/${data.part.id}/log?returnTo=${encodeURIComponent(partHref)}`);
</script>

<main class="mx-auto max-w-[700px]">
	<p class="mb-1 text-sm text-text-muted">
		<a href="/media/{data.item.slug}" class="text-accent no-underline hover:text-text">{data.item.title}</a>
		·
		<a href={backHref} class="text-accent no-underline hover:text-text">
			{data.season ? `Season ${data.season.partNumber}` : "Episodes"}
		</a>
	</p>

	<h1 class="mb-4 text-xl">
		{data.part.partNumber}. {data.part.title}
	</h1>

	{#if data.part.releaseDate}
		<p class="mb-4 font-mono text-sm text-text-muted">{data.part.releaseDate}</p>
	{/if}

	{#if data.part.metadata?.overview}
		<p class="mb-6 leading-relaxed text-text">{data.part.metadata.overview}</p>
	{/if}

	<a
		href={logHref}
		class="mb-8 inline-block rounded-sm bg-accent px-6 py-2.5 text-bg no-underline transition-opacity hover:opacity-90"
	>
		Log this episode
	</a>

	<section class="border-t border-border pt-8">
		<h2 class="mb-6 text-xl">Logs & Reviews</h2>
		{#if visibleLogs.length === 0}
			<p class="text-text-muted">No one has logged this episode yet.</p>
		{:else}
			{#each visibleLogs as log (log.id)}
				<LogCard
					{log}
					showMediaInfo={false}
					showAuthor={true}
					isOwner={data.currentUserId === log.userId}
					returnTo={partHref}
					onDelete={handleDeleted}
				/>
			{/each}
		{/if}
	</section>
</main>
