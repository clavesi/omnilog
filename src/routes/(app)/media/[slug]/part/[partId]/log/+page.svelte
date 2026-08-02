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
		label={data.hasPriorLog ? "Logging again" : "Log"}
		partLabel="{data.part.partNumber}. {data.part.title}"
	/>
	<LogForm today={data.today} cancelHref={data.returnTo} submitLabel="Save log" returnTo={data.returnTo} {form} />
</div>
