<script lang="ts">
import StaticStars from "./StaticStars.svelte";

type LogCardData = {
	id: string;
	rating: number | null;
	reviewTitle: string | null;
	reviewBody: string | null;
	containsSpoilers: boolean;
	isRewatch: boolean;
	loggedAt: string | null;
	createdAt: string | Date;
	mediaSlug: string;
	mediaTitle: string;
	mediaCoverUrl: string | null;
	username?: string;
};

type Props = {
	log: LogCardData;
	showMediaInfo?: boolean;
	isOwner?: boolean;
	onDelete?: (logId: string) => void;
};

let { log, showMediaInfo = true, isOwner = false, onDelete }: Props = $props();

let revealSpoilers = $state(false);

const displayDate = $derived.by(() => {
	const d = log.loggedAt ?? (typeof log.createdAt === "string" ? log.createdAt : log.createdAt.toISOString());
	return new Date(d).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
});

let deleting = $state(false);

async function handleDelete() {
	if (!confirm("Delete this log? This can't be undone.")) return;
	deleting = true;
	try {
		const res = await fetch(`/api/logs/${log.id}`, { method: "DELETE" });
		if (res.ok) {
			onDelete?.(log.id);
		} else {
			alert("Failed to delete log");
		}
	} finally {
		deleting = false;
	}
}
</script>

<article class="log-card" class:deleting>
	<div class="row">
		{#if showMediaInfo}
			<a href="/media/{log.mediaSlug}" class="poster-link">
				{#if log.mediaCoverUrl}
					<img src={log.mediaCoverUrl} alt="" class="poster" />
				{:else}
					<div class="poster-placeholder"></div>
				{/if}
			</a>
		{/if}

		<div class="content">
			<div class="meta-row">
				{#if showMediaInfo}
					<a href="/media/{log.mediaSlug}" class="media-title">{log.mediaTitle}</a>
				{:else if log.username}
					<a href="/u/{log.username}" class="author">{log.username}</a>
				{/if}
				{#if log.rating !== null}
					<StaticStars value={log.rating} size={16} />
				{/if}
				{#if log.isRewatch}
					<span class="badge">Rewatch</span>
				{/if}
			</div>

			<time class="date">{displayDate}</time>

			{#if log.reviewBody}
				<div class="review">
					{#if log.reviewTitle}
						<h3 class="review-title">{log.reviewTitle}</h3>
					{/if}

					{#if log.containsSpoilers && !revealSpoilers}
						<button
							type="button"
							class="spoiler-reveal"
							onclick={() => (revealSpoilers = true)}
						>
							Contains spoilers — click to reveal
						</button>
					{:else}
						<p class="review-body">{log.reviewBody}</p>
					{/if}
				</div>
			{/if}

			{#if isOwner}
				<div class="owner-actions">
					<a href="/media/{log.mediaSlug}/log/{log.id}/edit">Edit</a>
					<button type="button" onclick={handleDelete} disabled={deleting}>
						{deleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			{/if}
		</div>
	</div>
</article>

<style>
	.log-card {
		border-bottom: 1px solid #eee;
		padding: 1rem 0;
		transition: opacity 0.15s ease;
	}
	.log-card.deleting {
		opacity: 0.5;
	}
	.row {
		display: flex;
		gap: 1rem;
	}
	.poster-link {
		flex-shrink: 0;
	}
	.poster,
	.poster-placeholder {
		width: 46px;
		height: 69px;
		object-fit: cover;
		border-radius: 0.25rem;
		background: #eee;
	}
	.content {
		flex: 1;
		min-width: 0;
	}
	.meta-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}
	.media-title {
		font-weight: 600;
		text-decoration: none;
		color: inherit;
	}
	.media-title:hover {
		text-decoration: underline;
	}
	.author {
		font-weight: 600;
		text-decoration: none;
		color: #2563eb;
	}
	.author:hover {
		text-decoration: underline;
	}
	.badge {
		font-size: 0.6875rem;
		background: #eef2ff;
		color: #4338ca;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}
	.date {
		display: block;
		color: #888;
		font-size: 0.8125rem;
		margin-top: 0.125rem;
	}
	.review {
		margin-top: 0.5rem;
	}
	.review-title {
		font-size: 0.9375rem;
		margin: 0 0 0.25rem;
	}
	.review-body {
		white-space: pre-wrap;
		line-height: 1.5;
		color: #333;
		margin: 0;
	}
	.spoiler-reveal {
		background: #f5f5f5;
		border: 1px dashed #ccc;
		border-radius: 0.25rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: #666;
		cursor: pointer;
	}
	.owner-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
		font-size: 0.8125rem;
	}
	.owner-actions a {
		color: #2563eb;
		text-decoration: none;
	}
	.owner-actions a:hover {
		text-decoration: underline;
	}
	.owner-actions button {
		background: none;
		border: none;
		color: #c33;
		cursor: pointer;
		padding: 0;
		font-size: inherit;
	}
	.owner-actions button:hover {
		text-decoration: underline;
	}
</style>
