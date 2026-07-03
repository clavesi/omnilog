<!-- src/routes/(app)/feed/+page.svelte -->
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

<main class="feed">
	<h1>Feed</h1>

	{#if feedLogs.length === 0}
		<p class="empty">No public logs yet. Be the first to log something!</p>
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
		<button type="button" class="load-more" onclick={loadMore} disabled={loadingMore}>
			{loadingMore ? "Loading..." : "Load more"}
		</button>
	{/if}
</main>

<style>
	.feed {
		max-width: 700px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	h1 {
		margin: 0 0 1.5rem;
	}
	.empty {
		color: #888;
		padding: 2rem 0;
		text-align: center;
	}
	.load-more {
		display: block;
		margin: 1.5rem auto 0;
		padding: 0.625rem 1.5rem;
		background: #f3f4f6;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font: inherit;
	}
	.load-more:hover:not(:disabled) {
		background: #e5e7eb;
	}
	.load-more:disabled {
		opacity: 0.6;
		cursor: wait;
	}
</style>
