<script lang="ts">
	export let data;
</script>

<div class="p-4">
	{#if data.username}
		<div>
			<h1 class="text-3xl fontHeader">Hello, <span class="text-yellow">{data.username}</span></h1>
			<p class="text-lg">Welcome to <span class="text-mauve">omnilog</span>!</p>
		</div>
	{:else}
		<h1 class="text-3xl font-bold">Welcome to SvelteKit</h1>
		<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
	{/if}
</div>
