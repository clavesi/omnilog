<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let feedLogs = $state(data.initialLogs);
let cursor = $state(data.initialCursor);
let loadingMore = $state(false);

function handleDeleted(logId: string) {
	feedLogs = feedLogs.filter((l) => l.id !== logId);
}

async function loadMore() {
	if (!cursor || loadingMore) return;
	loadingMore = true;
	try {
		const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`);
		const page = await res.json();
		feedLogs = [...feedLogs, ...page.logs];
		cursor = page.nextCursor;
	} finally {
		loadingMore = false;
	}
}
</script>

<div>
	<h1 class="mb-8 text-2xl">Feed</h1>

	{#if feedLogs.length === 0}
		<p class="py-12 text-center text-text-muted">No public logs yet. Be the first to log something!</p>
	{:else}
		{#each feedLogs as log (log.id)}
			<LogCard
				{log}
				showMediaInfo={true}
				showAuthor={true}
				isOwner={data.currentUserId === log.userId}
				onDelete={handleDeleted}
			/>
		{/each}
	{/if}

	{#if cursor}
		<button
			type="button"
			class="mt-8 block w-full cursor-pointer rounded-sm border border-border bg-transparent py-3 font-mono text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text disabled:cursor-wait disabled:opacity-60"
			onclick={loadMore}
			disabled={loadingMore}
		>
			{loadingMore ? "Loading..." : "Load more"}
		</button>
	{/if}
</div>
