<script lang="ts">
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data } = $props();
</script>

<div>
	<p class="mb-2 flex items-center gap-2 text-sm text-text-muted">
		<MediaTypeMark mediaType={data.item.mediaType} variant="dot" />
		<a href="/media/{data.item.slug}" class="text-accent no-underline hover:text-text">
			{data.item.title}
		</a>
	</p>
	<h1 class="mb-6 text-2xl">Chapters</h1>

	<div class="rounded-sm border border-dashed border-border p-6 text-center text-text-muted">
		<p class="m-0">Chapter-level tracking isn't currently supported for manga.</p>
	</div>
</div>