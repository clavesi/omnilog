<script lang="ts">
import { enhance } from "$app/forms";
import LogCard from "$lib/components/LogCard.svelte";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import { getMediaTypeColor, mediaTypeLabel } from "$lib/media-type-colors";
import { SHOWCASE_TYPE_ORDER } from "$lib/media-types";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
let visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}

const orderedShowcase = $derived(
	[...data.showcase].sort(
		(a, b) => SHOWCASE_TYPE_ORDER.indexOf(a.mediaType as never) - SHOWCASE_TYPE_ORDER.indexOf(b.mediaType as never),
	),
);
</script>

<div>
	<header class="mb-10 flex items-center gap-5 border-b border-border pb-8">
		{#if data.profileUser.imageURL}
			<img
				src={data.profileUser.imageURL}
				alt=""
				class="h-18 w-18 shrink-0 rounded-sm object-cover"
			/>
		{:else}
			<div
				class="flex h-18 w-18 shrink-0 items-center justify-center rounded-sm border border-border bg-surface font-display text-[1.75rem] font-semibold text-accent"
			>
				{data.profileUser.username[0]?.toUpperCase()}
			</div>
		{/if}
		<div class="flex-1">
			<div class="mb-1 flex items-center gap-3">
				<h1 class="text-2xl">{data.profileUser.username}</h1>
				{#if data.profileUser.isPrivate}
					<span class="font-mono text-xs text-text-muted">Private</span>
				{/if}
			</div>
			{#if data.profileUser.bio}
				<p class="mb-2 text-text-muted">{data.profileUser.bio}</p>
			{/if}
		
			<div class="flex flex-wrap items-center gap-4 font-mono text-sm text-text-muted">
				<span>{visibleLogs.length} log{visibleLogs.length === 1 ? "" : "s"}</span>
				<a
					href="/u/{data.profileUser.username}/followers"
					class="text-text-muted no-underline hover:text-text"
				>
					{data.followCounts.followers} follower{data.followCounts.followers === 1 ? "" : "s"}
				</a>
				<a
					href="/u/{data.profileUser.username}/following"
					class="text-text-muted no-underline hover:text-text"
				>
					{data.followCounts.following} following
				</a>
			</div>

			{#if data.trackedCount > 0 || data.tagCount > 0}
				<nav class="mt-3 flex flex-wrap gap-2" aria-label="Profile sections">
					{#if data.trackedCount > 0}
						<a
							href="/u/{data.profileUser.username}/library"
							class="rounded-sm border border-border px-2.5 py-1 text-sm text-text-muted no-underline transition-colors hover:border-accent hover:text-accent"
						>
							Library
							<span class="ml-1 font-mono text-xs opacity-60">{data.trackedCount}</span>
						</a>
					{/if}
					{#if data.tagCount > 0}
						<a
							href="/u/{data.profileUser.username}/tags"
							class="rounded-sm border border-border px-2.5 py-1 text-sm text-text-muted no-underline transition-colors hover:border-accent hover:text-accent"
						>
							Tags
							<span class="ml-1 font-mono text-xs opacity-60">{data.tagCount}</span>
						</a>
					{/if}
				</nav>
			{/if}
		</div>

		{#if !data.isOwnProfile && data.followStatus !== null}
			<div class="shrink-0">
				{#if data.followStatus === "accepted"}
					<form method="POST" action="?/unfollow" use:enhance>
						<button
							type="submit"
							class="rounded-sm border border-border px-4 py-2 text-sm text-text transition-colors hover:border-text-muted hover:bg-surface"
						>
							Following
						</button>
					</form>
				{:else if data.followStatus === "pending"}
					<form method="POST" action="?/unfollow" use:enhance>
						<button
							type="submit"
							class="rounded-sm border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-text-muted hover:bg-surface"
						>
							Requested
						</button>
					</form>
				{:else}
					<form method="POST" action="?/follow" use:enhance>
						<button
							type="submit"
							class="rounded-sm bg-accent px-4 py-2 text-sm text-bg transition-opacity hover:opacity-90"
						>
							Follow
						</button>
					</form>
				{/if}
			</div>
		{/if}
	</header>

	{#if !data.canSeeLogs}
		<div class="py-16 text-center text-text-muted">
			<p class="m-0 text-lg">This account is private.</p>
			<p class="m-0 mt-1 text-sm">Follow to see their logs.</p>
		</div>
	{:else}
		{#if orderedShowcase.length > 0}
			<section class="mb-10">
				<h2 class="mb-4 text-sm tracking-wide text-text-muted uppercase">Showcase</h2>
				<div class="grid grid-cols-1 gap-4 min-105:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
					{#each orderedShowcase as fav (fav.mediaItemId)}
						<a
							href="/media/{fav.slug}"
							class="group/cover min-w-0 no-underline"
							style="--type-color: {getMediaTypeColor(fav.mediaType)}"
						>
							<div class="flex gap-1.5">
								<MediaTypeMark mediaType={fav.mediaType} variant="tab" />
								{#if fav.coverImageUrl}
									<img
										src={fav.coverImageUrl}
										alt=""
										class="aspect-2/3 w-full rounded-sm object-cover group-hover/cover:shadow-[0_0_0_1px_var(--type-color)]"
									/>
								{:else}
									<div class="flex aspect-2/3 w-full items-center justify-center rounded-sm border border-border bg-surface text-text-muted">
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

		<section class="mb-10">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="m-0 text-sm tracking-wide text-text-muted uppercase">Lists</h2>
				{#if data.isOwnProfile}
					<a href="/lists/new" class="text-sm text-accent no-underline hover:text-text">+ New list</a>
				{/if}
			</div>

			{#if data.lists.length === 0}
				<p class="text-sm text-text-muted">
					{data.isOwnProfile ? "No lists yet — create one from any media page." : "No public lists yet."}
				</p>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					{#each data.lists as list (list.id)}
						<a
							href="/lists/{list.id}"
							class="rounded-sm border border-border p-4 no-underline transition-colors hover:border-text-muted hover:bg-surface"
						>
							<div class="mb-3 flex -space-x-6">
								{#each list.coverImageUrls as url (url)}
									<img src={url} alt="" class="aspect-2/3 w-14 rounded-sm border-2 border-bg object-cover" />
								{/each}
								{#if list.coverImageUrls.length === 0}
									<div class="flex aspect-2/3 w-14 items-center justify-center rounded-sm border border-border bg-surface text-text-muted">
										?
									</div>
								{/if}
							</div>
							<p class="m-0 font-display font-medium text-text">
								{list.title}
								{#if !list.isPublic}
									<span class="ml-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-text-muted">
										Private
									</span>
								{/if}
							</p>
							<p class="m-0 mt-0.5 font-mono text-sm text-text-muted">
								{list.itemCount} item{list.itemCount === 1 ? "" : "s"}
							</p>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<section>
			{#if visibleLogs.length === 0}
				<p class="py-8 text-center text-text-muted">
					{data.isOwnProfile ? "You haven't logged anything yet." : "No logs yet."}
				</p>
			{:else}
				{#each visibleLogs as log (log.id)}
					<LogCard
						{log}
						showMediaInfo={true}
						isOwner={data.isOwnProfile}
						tagOwnerUsername={data.profileUser.username}
						commentCount={log.commentCount ?? 0}
						reactionCount={log.reactionCount ?? 0}
						onDelete={handleDeleted}
					/>
				{/each}
			{/if}
		</section>
	{/if}
</div>
