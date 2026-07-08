<script lang="ts">
import { getMediaTypeColor, mediaTypeLabel } from "$lib/media-type-colors";

type Props = {
	mediaType: string;
	variant?: "tab" | "dot";
};

let { mediaType, variant = "tab" }: Props = $props();

const color = $derived(getMediaTypeColor(mediaType));
const label = $derived(mediaTypeLabel(mediaType));
</script>

{#if variant === "tab"}
	<span
		class="shrink-0 self-stretch rounded-sm"
		style="width: 3px; background-color: {color}"
		aria-hidden="true"
	></span>
{:else}
	<span
		class="inline-block shrink-0 rounded-full"
		style="width: 8px; height: 8px; background-color: {color}"
		aria-label={label}
		title={label}
	></span>
{/if}
