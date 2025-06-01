<script lang="ts">
	const { data } = $props();
</script>

<div class="flex h-[calc(100vh-60px)] flex-col items-center justify-center gap-2">
	{#if data.user}
		<div class="flex flex-col items-center justify-center gap-2">
			<h1>Welcome home, <b>{data.user.name}</b>!</h1>
			<img src={data.user.image} alt="User Avatar" class="h-16 w-16 rounded-full" />
		</div>
	{:else}
		<h1>Welcome to <b>omnilog</b>!</h1>
	{/if}
</div>
