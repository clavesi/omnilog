<script lang="ts">
import { mediaTypeLabel } from "$lib/media-type-colors";
import { MEDIA_TYPES } from "$lib/media-types";

type Props = {
	activeType: string | null;
	hrefFor: (type: string | null) => string;
};

let { activeType, hrefFor }: Props = $props();
</script>

<nav class="mb-8 flex flex-wrap gap-2" aria-label="Filter by media type">
	<a
		href={hrefFor(null)}
		class="rounded-sm border px-2.5 py-1 text-sm no-underline transition-colors {activeType === null
			? 'border-accent text-accent'
			: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
	>
		All
	</a>
	{#each MEDIA_TYPES as t (t)}
		<a
			href={hrefFor(t)}
			class="rounded-sm border px-2.5 py-1 text-sm no-underline transition-colors {activeType === t
				? 'border-accent text-accent'
				: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
		>
			{mediaTypeLabel(t)}
		</a>
	{/each}
</nav>
