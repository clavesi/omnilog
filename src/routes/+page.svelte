<script lang="ts">
	let { data } = $props();
</script>

<main class="flex h-[80vh] items-center justify-center">
	{#if data.user}
		<div class="flex flex-col items-center justify-center">
			<p>Welcome, {data.user.name}!</p>
		</div>
	{:else}
		<p>You are not logged in</p>
	{/if}
</main>
