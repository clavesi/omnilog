<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<header class="flex h-20 w-full shrink-0 items-center bg-neutral-900 px-4 text-white md:px-6">
	<nav class="mr-auto items-center justify-center gap-6 lg:flex">
		<div>
			<img
				class="h-8 w-8"
				src="https://static.vecteezy.com/system/resources/previews/016/916/479/original/placeholder-icon-design-free-vector.jpg"
				alt="Logo"
			/>
		</div>
		<div class="flex justify-between gap-4 uppercase">
			<a>Movies</a>
			<a>Shows</a>
			<a>Anime</a>
			<a>Manga</a>
			<a>Books</a>
			<a>Music</a>
		</div>
	</nav>
</header>
{@render children()}
