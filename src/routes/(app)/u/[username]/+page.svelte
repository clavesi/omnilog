<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
let visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}
</script>

<div>
	<header class="mb-10 flex items-center gap-5 border-b border-border pb-8">
		{#if data.profileUser.avatarUrl}
			<img
				src={data.profileUser.avatarUrl}
				alt=""
				class="h-[72px] w-[72px] shrink-0 rounded-sm object-cover"
			/>
		{:else}
			<div
				class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-sm border border-border bg-surface font-display text-[1.75rem] font-semibold text-accent"
			>
				{data.profileUser.username[0]?.toUpperCase()}
			</div>
		{/if}
		<div>
			<h1 class="mb-1 text-2xl">{data.profileUser.username}</h1>
			{#if data.profileUser.bio}
				<p class="mb-2 text-text-muted">{data.profileUser.bio}</p>
			{/if}
			<p class="m-0 font-mono text-sm text-text-muted">
				{visibleLogs.length} log{visibleLogs.length === 1 ? "" : "s"}
			</p>
		</div>
	</header>

	<section>
		{#if visibleLogs.length === 0}
			<p class="py-8 text-center text-text-muted">
				{data.isOwnProfile ? "You haven't logged anything yet." : "No logs yet."}
			</p>
		{:else}
			{#each visibleLogs as log (log.id)}
				<LogCard {log} showMediaInfo={true} isOwner={data.isOwnProfile} onDelete={handleDeleted} />
			{/each}
		{/if}
	</section>
</div>
