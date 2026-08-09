<script lang="ts">
let { data } = $props();
</script>

<div>
	<header class="mb-8">
		<p class="m-0 mb-1 text-sm text-text-muted">
			<a href="/u/{data.profileUser.username}" class="link-soft">{data.profileUser.username}</a>
		</p>
		<h1 class="m-0 font-display text-3xl tracking-tight sm:text-4xl">Tags</h1>
	</header>

	{#if data.tags.length === 0}
		<p class="text-text-muted">No tags yet.</p>
	{:else}
		<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
			{#each data.tags as tag (tag.id)}
				<li>
					<a
						href="/u/{data.profileUser.username}/tags/{tag.slug}"
						class="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-accent hover:text-accent"
					>
						{tag.name}
						<span class="ml-1 font-mono text-xs opacity-60">{tag.count}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
