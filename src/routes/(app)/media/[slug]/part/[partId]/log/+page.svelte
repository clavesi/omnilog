<script lang="ts">
import LogForm from "$lib/components/LogForm.svelte";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data, form } = $props();
</script>

<div>
	<header class="mb-8 flex items-start gap-4 border-b border-border pb-8">
		<div class="flex shrink-0 gap-1.5">
			<MediaTypeMark mediaType={data.item.mediaType} variant="tab" />
			{#if data.item.coverImageUrl}
				<img src={data.item.coverImageUrl} alt="" class="h-24 w-16 rounded-sm object-cover" />
			{/if}
		</div>
		<div>
			<p class="mb-1 font-mono text-xs tracking-wider text-text-muted uppercase">
				{data.hasPriorLog ? "Logging again" : "Log"}
			</p>
			<h1 class="text-xl">
				{data.item.title}
				<span class="font-mono text-text-muted">
					— {data.part.partNumber}. {data.part.title}
				</span>
			</h1>
		</div>
	</header>

	<LogForm
		today={data.today}
		cancelHref={data.returnTo}
		submitLabel="Save log"
		returnTo={data.returnTo}
		{form}
	/>
</div>
