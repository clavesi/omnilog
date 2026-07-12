<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import { getMediaTypeColor, mediaTypeLabel } from "$lib/media-type-colors";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
let visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}

// Stable display order — otherwise the grid would shuffle based on
// whatever order the DB happens to return rows in.
const TYPE_ORDER = ["movie", "tv", "anime", "manga", "game", "music", "book"];
const orderedShowcase = $derived(
	[...data.showcase].sort((a, b) => TYPE_ORDER.indexOf(a.mediaType) - TYPE_ORDER.indexOf(b.mediaType)),
);
</script>

<div>
	<header class="mb-10 flex items-center gap-5 border-b border-border pb-8">
		{#if data.profileUser.avatarUrl}
			<img
				src={data.profileUser.avatarUrl}
				alt=""
				class="h-[72px] w-[72px] shrink-0 rounded-sm object-cover"
			/>
		{:else}
			<div
				class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-sm border border-border bg-surface font-display text-[1.75rem] font-semibold text-accent"
			>
				{data.profileUser.username[0]?.toUpperCase()}
			</div>
		{/if}
		<div>
			<h1 class="mb-1 text-2xl">{data.profileUser.username}</h1>
			{#if data.profileUser.bio}
				<p class="mb-2 text-text-muted">{data.profileUser.bio}</p>
			{/if}
			<p class="m-0 font-mono text-sm text-text-muted">
				{visibleLogs.length} log{visibleLogs.length === 1 ? "" : "s"}
			</p>
		</div>
	</header>

	{#if orderedShowcase.length > 0}
		<section class="mb-10">
			<h2 class="mb-4 text-sm tracking-wide text-text-muted uppercase">Showcase</h2>
			<div class="flex flex-wrap gap-4">
				{#each orderedShowcase as fav (fav.mediaItemId)}
					<a
						href="/media/{fav.slug}"
						class="group/cover w-[110px] shrink-0 no-underline"
						style="--type-color: {getMediaTypeColor(fav.mediaType)}"
					>
						<div class="flex gap-1.5">
							<MediaTypeMark mediaType={fav.mediaType} variant="tab" />
							{#if fav.coverImageUrl}
								<img
									src={fav.coverImageUrl}
									alt=""
									class="w-full rounded-sm group-hover/cover:shadow-[0_0_0_1px_var(--type-color)]"
								/>
							{:else}
								<div class="flex w-full items-center justify-center rounded-sm border border-border bg-surface py-8 text-text-muted">
									?
								</div>
							{/if}
						</div>
						<p class="mt-2 mb-0 truncate text-sm text-text">{fav.title}</p>
						<p class="m-0 font-mono text-xs text-text-muted">{mediaTypeLabel(fav.mediaType)}</p>
					</a>
				{/each}
			</div>
		</section>
	{:else if data.isOwnProfile}
		<section class="mb-10 rounded-sm border border-dashed border-border p-6 text-center text-text-muted">
			<p class="m-0">
				No favorites set yet. Visit any movie, show, game, or other media page and click the star
				to add it to your showcase.
			</p>
		</section>
	{/if}

	<section>
		{#if visibleLogs.length === 0}
			<p class="py-8 text-center text-text-muted">
				{data.isOwnProfile ? "You haven't logged anything yet." : "No logs yet."}
			</p>
		{:else}
			{#each visibleLogs as log (log.id)}
				<LogCard {log} showMediaInfo={true} isOwner={data.isOwnProfile} onDelete={handleDeleted} />
			{/each}
		{/if}
	</section>
</div>