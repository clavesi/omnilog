<script lang="ts">
type Props = {
	page: number;
	totalPages: number;
	hrefFor: (page: number) => string;
};

let { page, totalPages, hrefFor }: Props = $props();
</script>

{#if totalPages > 1}
	<nav class="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
		{#if page > 1}
			<a
				href={hrefFor(page - 1)}
				class="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
			>
				← Prev
			</a>
		{/if}
		<span class="font-mono text-sm text-text-muted">{page} / {totalPages}</span>
		{#if page < totalPages}
			<a
				href={hrefFor(page + 1)}
				class="rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
			>
				Next →
			</a>
		{/if}
	</nav>
{/if}
