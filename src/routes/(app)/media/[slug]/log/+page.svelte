<script lang="ts">
import LogForm from "$lib/components/LogForm.svelte";
import LogPageHeader from "$lib/components/LogPageHeader.svelte";

let { data, form } = $props();
</script>

<div>
	<LogPageHeader
		mediaType={data.item.mediaType}
		coverImageUrl={data.item.coverImageUrl}
		title={data.item.title}
		releaseDate={data.item.releaseDate}
		label={data.hasPriorLog ? "Logging again" : "Log"}
	/>
	<LogForm
		today={data.today}
		cancelHref="/media/{data.item.slug}"
		submitLabel="Save log"
		defaultCommentPolicy={data.defaultCommentPolicy}
		offerMarkCompleted
		alreadyCompleted={data.alreadyCompleted}
		tagSuggestions={data.tagSuggestions}
		{form}
	/>
</div>
