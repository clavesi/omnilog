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
		label="Edit log"
	/>
	<LogForm
		today={data.today}
		cancelHref="/media/{data.item.slug}"
		submitLabel="Save changes"
		{form}
		initial={{
			rating: data.log.rating,
			loggedAt: data.log.loggedAt ?? "",
			reviewBody: data.log.reviewBody ?? "",
			reviewTitle: data.log.reviewTitle ?? "",
			containsSpoilers: data.log.containsSpoilers,
			isPublic: data.log.isPublic,
			commentPolicy: data.log.commentPolicy,
			showReview: !!data.log.reviewBody,
		}}
	/>
</div>
