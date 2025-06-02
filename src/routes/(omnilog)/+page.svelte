<script lang="ts">
	const { data } = $props();
</script>

<svelte:head>
	<title>Home | omnilog</title>
</svelte:head>

<div class="flex h-[calc(100vh-60px)] flex-col items-center gap-2 py-4">
	{#if data.user}
		<div class="flex flex-col items-center justify-center gap-2">
			<h1>Hello, <b>{data.user.name}</b>!</h1>
			<p>Consume anything new recently?</p>
		</div>
	{:else}
		<h1>Welcome to <b>omnilog</b>!</h1>
	{/if}
</div>
