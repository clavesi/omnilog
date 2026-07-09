<script lang="ts">
import LogForm from "$lib/components/LogForm.svelte";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data, form } = $props();

const year = $derived(data.item.releaseDate ? data.item.releaseDate.slice(0, 4) : null);
</script>

<div>
	<header class="mb-8 flex items-start gap-4 border-b border-border pb-8">
		<div class="flex shrink-0 gap-1.5">
			<MediaTypeMark mediaType={data.item.mediaType} variant="tab" />
			{#if data.item.coverImageUrl}
				<img class="h-24 w-16 rounded-sm object-cover" src={data.item.coverImageUrl} alt="" />
			{/if}
		</div>
		<div>
			<p class="mb-1 font-mono text-xs tracking-wider text-text-muted uppercase">
				{data.hasPriorLog ? "Logging again" : "Log"}
			</p>
			<h1 class="m-0 text-2xl">
				{data.item.title}
				{#if year}
					<span class="font-mono font-normal text-text-muted">({year})</span>
				{/if}
			</h1>
		</div>
	</header>

	<LogForm
		today={data.today}
		cancelHref="/media/{data.item.slug}"
		submitLabel="Save log"
		{form}
	/>
</div>
