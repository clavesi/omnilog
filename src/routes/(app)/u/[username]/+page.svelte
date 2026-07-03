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

<main class="profile">
	<header class="header">
		{#if data.profileUser.avatarUrl}
			<img src={data.profileUser.avatarUrl} alt="" class="avatar" />
		{:else}
			<div class="avatar-placeholder">{data.profileUser.username[0]?.toUpperCase()}</div>
		{/if}
		<div>
			<h1>{data.profileUser.username}</h1>
			{#if data.profileUser.bio}
				<p class="bio">{data.profileUser.bio}</p>
			{/if}
			<p class="log-count">{visibleLogs.length} log{visibleLogs.length === 1 ? "" : "s"}</p>
		</div>
	</header>

	<section class="logs">
		{#if visibleLogs.length === 0}
			<p class="empty">
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

<style>
	.profile {
		max-width: 700px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	.header {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		margin-bottom: 2rem;
	}
	.avatar,
	.avatar-placeholder {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
	.avatar-placeholder {
		background: #2563eb;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		font-weight: 600;
	}
	h1 {
		margin: 0 0 0.25rem;
	}
	.bio {
		color: #555;
		margin: 0 0 0.25rem;
	}
	.log-count {
		color: #888;
		font-size: 0.875rem;
		margin: 0;
	}
	.logs {
		display: flex;
		flex-direction: column;
	}
	.empty {
		color: #888;
		padding: 2rem 0;
		text-align: center;
	}
</style>
