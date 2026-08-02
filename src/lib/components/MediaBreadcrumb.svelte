<script lang="ts">
import MediaTypeMark from "./MediaTypeMark.svelte";

type Props = {
	mediaType: string;
	slug: string;
	title: string;
};

let { mediaType, slug, title }: Props = $props();
</script>

<p class="mb-2 flex items-center gap-2 text-sm text-text-muted">
	<MediaTypeMark {mediaType} variant="dot" />
	<a href="/media/{slug}" class="text-accent no-underline hover:text-text">
		{title}
	</a>
</p>
