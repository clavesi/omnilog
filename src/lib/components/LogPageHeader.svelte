<script lang="ts">
import MediaTypeMark from "./MediaTypeMark.svelte";

type Props = {
	mediaType: string;
	coverImageUrl: string | null;
	title: string;
	releaseDate?: string | null;
	/** Label shown above the title: "Log", "Logging again", "Edit log", etc. */
	label: string;
	/** Optional part label shown after the title (episode/track name). */
	partLabel?: string | null;
};

let { mediaType, coverImageUrl, title, releaseDate, label, partLabel }: Props = $props();

const year = $derived(releaseDate ? releaseDate.slice(0, 4) : null);
</script>

<header class="mb-8 flex items-start gap-4 border-b border-border pb-8">
	<div class="flex shrink-0 gap-1.5">
		<MediaTypeMark {mediaType} variant="tab" />
		{#if coverImageUrl}
			<img class="h-24 w-16 rounded-sm object-cover" src={coverImageUrl} alt="" />
		{/if}
	</div>
	<div>
		<p class="mb-1 font-mono text-xs tracking-wider text-text-muted uppercase">{label}</p>
		{#if partLabel}
			<h1 class="text-xl">
				{title}
				<span class="font-mono text-text-muted">— {partLabel}</span>
			</h1>
		{:else}
			<h1 class="m-0 text-2xl">
				{title}
				{#if year}
					<span class="font-mono font-normal text-text-muted">({year})</span>
				{/if}
			</h1>
		{/if}
	</div>
</header>
