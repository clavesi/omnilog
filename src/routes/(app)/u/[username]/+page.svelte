<script lang="ts">
import { enhance } from "$app/forms";
import LogCard from "$lib/components/LogCard.svelte";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import { getMediaTypeColor, mediaTypeLabel } from "$lib/media-type-colors";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
let visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));
// svelte-ignore state_referenced_locally -- intentional, updated via enhance callbacks below
let followStatus = $state(data.followStatus);
// svelte-ignore state_referenced_locally -- intentional, filtered via enhance callbacks below
let pendingRequests = $state(data.pendingRequests);
let showFollowers = $state(false);
let showFollowing = $state(false);

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}

const TYPE_ORDER = ["movie", "tv", "anime", "manga", "game", "music", "book"];
const orderedShowcase = $derived(
	[...data.showcase].sort((a, b) => TYPE_ORDER.indexOf(a.mediaType) - TYPE_ORDER.indexOf(b.mediaType)),
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
			<div class="flex items-center gap-4 font-mono text-sm text-text-muted">
				<span>{visibleLogs.length} log{visibleLogs.length === 1 ? "" : "s"}</span>
				<button
					type="button"
					class="hover:text-text"
					onclick={() => (showFollowers = !showFollowers)}
				>
					{data.followCounts.followers} follower{data.followCounts.followers === 1 ? "" : "s"}
				</button>
				<button
					type="button"
					class="hover:text-text"
					onclick={() => (showFollowing = !showFollowing)}
				>
					{data.followCounts.following} following
				</button>
			</div>
		</div>

		{#if !data.isOwnProfile && data.followStatus !== null}
			<div class="shrink-0">
				{#if followStatus === "accepted"}
					<form
						method="POST"
						action="?/unfollow"
						use:enhance={() => {
							return async ({ update, result }) => {
								await update({ reset: false });
								if (result.type === "success") followStatus = "not_following";
							};
						}}
					>
						<button
							type="submit"
							class="rounded-sm border border-border px-4 py-2 text-sm text-text transition-colors hover:border-text-muted hover:bg-surface"
						>
							Following
						</button>
					</form>
				{:else if followStatus === "pending"}
					<form
						method="POST"
						action="?/unfollow"
						use:enhance={() => {
							return async ({ update, result }) => {
								await update({ reset: false });
								if (result.type === "success") followStatus = "not_following";
							};
						}}
					>
						<button
							type="submit"
							class="rounded-sm border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-text-muted hover:bg-surface"
						>
							Requested
						</button>
					</form>
				{:else}
					<form
						method="POST"
						action="?/follow"
						use:enhance={() => {
							return async ({ update, result }) => {
								await update({ reset: false });
								if (result.type === "success" && result.data?.followStatus) {
									followStatus = result.data.followStatus as typeof followStatus;
								}
							};
						}}
					>
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

	{#if showFollowers}
		<section class="mb-6 rounded-sm border border-border p-4">
			<h2 class="mb-3 text-sm font-medium">Followers</h2>
			{#if data.followers.length === 0}
				<p class="text-sm text-text-muted">No followers yet.</p>
			{:else}
				<ul class="m-0 list-none p-0 flex flex-wrap gap-3">
					{#each data.followers as f (f.id)}
						<li>
							<a href="/u/{f.username}" class="text-sm text-accent no-underline hover:text-text">
								{f.username}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	{#if showFollowing}
		<section class="mb-6 rounded-sm border border-border p-4">
			<h2 class="mb-3 text-sm font-medium">Following</h2>
			{#if data.following.length === 0}
				<p class="text-sm text-text-muted">Not following anyone yet.</p>
			{:else}
				<ul class="m-0 list-none p-0 flex flex-wrap gap-3">
					{#each data.following as f (f.id)}
						<li>
							<a href="/u/{f.username}" class="text-sm text-accent no-underline hover:text-text">
								{f.username}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	{#if data.isOwnProfile && pendingRequests.length > 0}
		<section class="mb-6 rounded-sm border border-border p-4">
			<h2 class="mb-3 text-sm font-medium">Follow requests</h2>
			<ul class="m-0 list-none divide-y divide-border p-0">
				{#each pendingRequests as req (req.id)}
					<li class="flex items-center justify-between gap-4 py-3">
						<a href="/u/{req.username}" class="text-sm text-accent no-underline hover:text-text">
							{req.username}
						</a>
						<div class="flex gap-2">
							<form
								method="POST"
								action="?/acceptRequest"
								use:enhance={() => {
									return async ({ update }) => {
										await update({ reset: false });
										pendingRequests = pendingRequests.filter((r) => r.id !== req.id);
									};
								}}
							>
								<input type="hidden" name="followerId" value={req.id} />
								<button
									type="submit"
									class="rounded-sm bg-accent px-3 py-1 text-xs text-bg transition-opacity hover:opacity-90"
								>
									Accept
								</button>
							</form>
							<form
								method="POST"
								action="?/rejectRequest"
								use:enhance={() => {
									return async ({ update }) => {
										await update({ reset: false });
										pendingRequests = pendingRequests.filter((r) => r.id !== req.id);
									};
								}}
							>
								<input type="hidden" name="followerId" value={req.id} />
								<button
									type="submit"
									class="rounded-sm border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-danger hover:text-danger"
								>
									Decline
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

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
				<LogCard {log} showMediaInfo={true} isOwner={data.isOwnProfile} onDelete={handleDeleted} />
			{/each}
		{/if}
	</section>
{/if}
</div>