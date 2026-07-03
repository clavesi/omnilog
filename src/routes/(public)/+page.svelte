<script lang="ts">
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
</script>

<div class="px-8 py-24 text-center">
	<h1>Omnilog</h1>
	<p>Track everything you watch, read, and play.</p>
	{#if data?.user}
		<a href="/feed">Go to your feed</a>
	{:else}
		<div class="mt-8 flex justify-center gap-4">
			<a href="/signup">Sign up</a>
			<a href="/login">Log in</a>
		</div>
	{/if}
</div>
