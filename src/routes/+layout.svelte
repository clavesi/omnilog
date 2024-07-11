<script lang="ts">
	import "../app.css";
	import { Button } from "$lib/components/ui/button";

	export let data;
</script>

<nav>
	<div class="flex items-center justify-between bg-green-500 p-4 text-xl text-white">
		<a href="/" class="text-4xl font-bold">omnilog</a>
		<div class="flex items-center gap-4">
			{#if data.username}
				<Button href="/auth/logout" class="rounded-md">Sign Out</Button>
				<img src={data.imageUrl} alt="user profile" class="size-12 rounded-full" />
			{:else}
				<a href="/auth/login">Login</a>
			{/if}
		</div>
	</div>
</nav>
<slot></slot>
