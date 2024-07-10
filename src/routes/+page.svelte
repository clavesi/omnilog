<script lang="ts">
	export let data;
</script>

{#if data.username}
	<div>
		<h1 class="text-3xl font-bold">Welcome, {data.username}!</h1>
	</div>
{:else}
	<h1 class="text-3xl font-bold">Welcome to SvelteKit</h1>
	<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
{/if}
