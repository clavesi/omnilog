<script lang="ts">
import { enhance } from "$app/forms";
import { MAX_COMMENT_LENGTH_CLIENT } from "$lib/comment-limits";
import CommentThread from "$lib/components/CommentThread.svelte";
import LogCard from "$lib/components/LogCard.svelte";
import MediaBreadcrumb from "$lib/components/MediaBreadcrumb.svelte";
import ReactionBar from "$lib/components/ReactionBar.svelte";

let { data } = $props();

const POLICY_LABELS: Record<string, string> = {
	everyone: "Everyone",
	followers: "Followers only",
	nobody: "No one",
};
</script>

<div>
	<MediaBreadcrumb
		mediaType={data.log.mediaType ?? "movie"}
		slug={data.log.mediaSlug}
		title={data.log.mediaTitle}
	/>

	<LogCard log={data.log} showMediaInfo={false} showAuthor isOwner={data.isOwner} showDiscussionLink={false} />

	<div class="mt-6 mb-10">
		<ReactionBar reactions={data.reactions} canReact={data.viewerId !== null} />
	</div>

	{#if data.isOwner}
		<form
			method="POST"
			action="?/setCommentPolicy"
			class="mb-10 flex flex-wrap items-center gap-2 border-y border-border py-3"
			use:enhance
		>
			<span class="font-mono text-xs text-text-muted">Who can comment</span>
			{#each Object.entries(POLICY_LABELS) as [value, label] (value)}
				<button
					type="submit"
					name="commentPolicy"
					{value}
					class="cursor-pointer rounded-sm border px-2.5 py-1 text-xs transition-colors {data.commentPolicy ===
					value
						? 'border-accent text-accent'
						: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
				>
					{label}
				</button>
			{/each}
		</form>
	{/if}

	<CommentThread
		comments={data.comments}
		viewerId={data.viewerId}
		logAuthorId={data.log.userId}
		denial={data.commentDenial}
		maxLength={MAX_COMMENT_LENGTH_CLIENT}
	/>
</div>
