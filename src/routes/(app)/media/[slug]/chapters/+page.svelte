<script lang="ts">
import MediaBreadcrumb from "$lib/components/MediaBreadcrumb.svelte";

let { data } = $props();
</script>

<div>
	<MediaBreadcrumb mediaType={data.item.mediaType} slug={data.item.slug} title={data.item.title} />
	<h1 class="mb-6 text-2xl">Chapters</h1>

	<div class="rounded-sm border border-dashed border-border p-6 text-center text-text-muted">
		<p class="m-0">Chapter-level tracking isn't currently supported for manga.</p>
	</div>
</div>
