<script lang="ts">
	import "../app.css";
	export let data;
</script>

<nav>
	<div class="flex items-center justify-between bg-green-500 p-4 text-xl text-white">
		<a href="/">Home</a>
		<div class="flex items-center gap-4">
			{#if data.username}
				<p>{data.username}</p>
				<a href="/logout">Logout</a>
			{:else}
				<a href="/login">Login</a>
			{/if}
		</div>
	</div>
</nav>
<slot></slot>
