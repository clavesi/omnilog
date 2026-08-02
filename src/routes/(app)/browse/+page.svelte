<script lang="ts">
let { data } = $props();

const genres = $derived(data.genres);
const decades = $derived(data.decades);
</script>

<div>
	<header class="mb-10">
		<h1 class="m-0 font-display text-4xl tracking-tight sm:text-5xl">Browse</h1>
		<div class="mt-4 flex items-center gap-3" aria-hidden="true">
			<span class="h-0.5 w-10 rounded-full bg-accent"></span>
			<span class="h-px flex-1 bg-border"></span>
		</div>
	</header>

	<section class="mb-12">
		<h2 class="mb-5 text-xl">Genres</h2>
		{#if genres.length === 0}
			<p class="text-text-muted">No genres yet — log some media to populate this.</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each genres as g (g.slug)}
					<a
						href="/browse/genre/{g.slug}"
						class="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-accent hover:text-accent"
					>
						{g.name}
						<span class="ml-1 font-mono text-xs opacity-60">{g.count}</span>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<section>
		<h2 class="mb-5 text-xl">Decades</h2>
		{#if decades.length === 0}
			<p class="text-text-muted">No media with release dates yet.</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#each decades as d (d.decade)}
					<a
						href="/browse/decade/{d.decade}s"
						class="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-accent hover:text-accent"
					>
						{d.decade}s
						<span class="ml-1 font-mono text-xs opacity-60">{d.count}</span>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
