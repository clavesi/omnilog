<script lang="ts">
	import '../app.css';
	import '@fontsource/roboto';

	let { children, data } = $props();
	let { session } = data;
</script>

<header class="bg-neutral-900 text-white">
	<nav class="mx-auto flex h-20 max-w-screen-xl flex-wrap items-center justify-between">
		<div class="flex items-center justify-between">
			<a href="/">
				<!-- TODO: Get a logo -->
				<img
					class="mr-4 h-16 w-16"
					src="https://static.vecteezy.com/system/resources/previews/016/916/479/original/placeholder-icon-design-free-vector.jpg"
					alt="Placeholder Logo"
				/>
			</a>
			<div class="flex items-center justify-between gap-4 font-black uppercase">
				<a href="/" class="hover:text-stone-300">Movies</a>
				<a href="/" class="hover:text-stone-300">Shows</a>
				<a href="/" class="hover:text-stone-300">Anime</a>
				<a href="/" class="hover:text-stone-300">Manga</a>
				<a href="/" class="hover:text-stone-300">Books</a>
				<a href="/" class="hover:text-stone-300">Music</a>
			</div>
		</div>
		<div class="w-full md:block md:w-auto">
			{#if !session}
				<a href="/login" class="hover:text-stone-300">Login</a>
			{:else}
				<a href="/profile" class="hover:brightness-75">
					<img class="h-12 w-12 rounded-full" src={session.user.image} alt="User" />
				</a>
			{/if}
		</div>
	</nav>
</header>
{@render children()}

<style>
	:global(body) {
		font-family: 'Roboto', cursive;
	}
</style>
