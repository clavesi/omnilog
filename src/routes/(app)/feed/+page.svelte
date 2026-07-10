<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let feedLogs = $state(data.initialLogs);
let cursor = $state(data.initialCursor);
let loadingMore = $state(false);
let loadError = $state<string | null>(null);

function handleDeleted(logId: string) {
	feedLogs = feedLogs.filter((l) => l.id !== logId);
}

async function loadMore() {
	if (!cursor || loadingMore) return;
	loadingMore = true;
	loadError = null;
	try {
		const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`);
		if (!res.ok) {
			loadError = "Couldn't load more logs. Try again.";
			return;
		}
		const page = await res.json();
		feedLogs = [...feedLogs, ...page.logs];
		cursor = page.nextCursor;
	} catch {
		loadError = "Couldn't load more logs. Try again.";
	} finally {
		loadingMore = false;
	}
}
</script>

<div>
	<header class="mb-10">
		<h1 class="m-0 font-display text-4xl tracking-tight sm:text-5xl">Feed</h1>
		<div class="mt-4 flex items-center gap-3" aria-hidden="true">
			<span class="h-0.5 w-10 rounded-full bg-accent"></span>
			<span class="h-px flex-1 bg-border"></span>
		</div>
		<p class="mt-3 font-mono text-sm text-text-muted">Latest logs from everyone</p>
	</header>

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

	{#if loadError}
		<p class="mt-4 text-center text-sm text-danger">{loadError}</p>
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
