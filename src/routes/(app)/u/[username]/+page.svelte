<!-- src/routes/u/[username]/+page.svelte -->
<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
let visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}
</script>

<main class="mx-auto my-8 max-w-[700px] px-4">
	<header class="mb-8 flex items-center gap-5">
		{#if data.profileUser.avatarUrl}
			<img src={data.profileUser.avatarUrl} alt="" class="h-[72px] w-[72px] shrink-0 rounded-full object-cover" />
		{:else}
			<div class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-[1.75rem] font-semibold text-white">
				{data.profileUser.username[0]?.toUpperCase()}
			</div>
		{/if}
		<div>
			<h1 class="mb-1">{data.profileUser.username}</h1>
			{#if data.profileUser.bio}
				<p class="mb-1 text-gray-600">{data.profileUser.bio}</p>
			{/if}
			<p class="m-0 text-sm text-gray-500">{visibleLogs.length} log{visibleLogs.length === 1 ? "" : "s"}</p>
		</div>
	</header>

	<section class="flex flex-col">
		{#if visibleLogs.length === 0}
			<p class="py-8 text-center text-gray-500">
				{data.isOwnProfile ? "You haven't logged anything yet." : "No logs yet."}
			</p>
		{:else}
			{#each visibleLogs as log (log.id)}
				<LogCard
					{log}
					showMediaInfo={true}
					isOwner={data.isOwnProfile}
					onDelete={handleDeleted}
				/>
			{/each}
		{/if}
	</section>
</main>
