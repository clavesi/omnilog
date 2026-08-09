<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let deletedIds = $state(new Set<string>());
const visibleLogs = $derived(data.logs.filter((l) => !deletedIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedIds = new Set([...deletedIds, logId]);
}
</script>

<div>
	<header class="mb-8">
		<p class="m-0 mb-1 text-sm text-text-muted">
			<a href="/u/{data.profileUser.username}" class="link-soft">{data.profileUser.username}</a>
			/
			<a href="/u/{data.profileUser.username}/tags" class="link-soft">Tags</a>
		</p>
		<h1 class="m-0 font-display text-3xl tracking-tight sm:text-4xl">{data.tag.name}</h1>
		<p class="mt-2 font-mono text-sm text-text-muted">
			{visibleLogs.length}
			{visibleLogs.length === 1 ? "log" : "logs"}
		</p>
	</header>

	{#if visibleLogs.length === 0}
		<p class="text-text-muted">Nothing tagged with this.</p>
	{:else}
		{#each visibleLogs as log (log.id)}
			<LogCard
				{log}
				showMediaInfo={true}
				isOwner={data.isOwnProfile}
				tagOwnerUsername={data.profileUser.username}
				onDelete={handleDeleted}
			/>
		{/each}
	{/if}
</div>
