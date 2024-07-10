<script lang="ts">
	import "../app.css";
	export let data;
</script>

<nav>
	<div class="flex items-center justify-between bg-green-500 p-4 text-xl text-white">
		<a href="/" class="text-4xl font-bold">omnilog</a>
		<div class="flex items-center gap-4">
			{#if data.username}
				<a href="/auth/logout" class="rounded-md bg-green-800 px-4 py-2">Logout</a>
				<img src={data.imageUrl} alt="user profile" class="size-12 rounded-full" />
			{:else}
				<a href="/auth/login">Login</a>
			{/if}
		</div>
	</div>
</nav>
<slot></slot>
