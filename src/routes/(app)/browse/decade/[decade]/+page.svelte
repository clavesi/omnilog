<script lang="ts">
import BrowseFilterBar from "$lib/components/BrowseFilterBar.svelte";
import MediaGrid from "$lib/components/MediaGrid.svelte";
import Pagination from "$lib/components/Pagination.svelte";

let { data } = $props();

function filterHref(type: string | null): string {
	const base = `/browse/decade/${data.decadeLabel}`;
	if (!type) return base;
	return `${base}?type=${type}`;
}

function pageHref(p: number): string {
	const params = new URLSearchParams();
	if (data.mediaType) params.set("type", data.mediaType);
	if (p > 1) params.set("page", String(p));
	const qs = params.toString();
	return `/browse/decade/${data.decadeLabel}${qs ? `?${qs}` : ""}`;
}
</script>

<div>
	<header class="mb-8">
		<p class="m-0 mb-1 text-sm text-text-muted">
			<a href="/browse" class="link-soft">Browse</a> / Decade
		</p>
		<h1 class="m-0 font-display text-3xl tracking-tight sm:text-4xl">{data.decadeLabel}</h1>
		<p class="mt-2 font-mono text-sm text-text-muted">
			{data.total} item{data.total === 1 ? "" : "s"}
		</p>
	</header>

	<BrowseFilterBar activeType={data.mediaType} hrefFor={filterHref} />
	<MediaGrid items={data.items} />
	<Pagination page={data.page} totalPages={data.totalPages} hrefFor={pageHref} />
</div>
