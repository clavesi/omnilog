<script lang="ts">
import { onMount } from "svelte";
import { enhance } from "$app/forms";
import { invalidate } from "$app/navigation";

let { data } = $props();

const notifications = $derived(data.notifications);

// The load function marked these read after building the list above, so the
// nav badge is a step behind. Refresh just the layout load to catch it up —
// this page's own data is left alone so the unread dots survive the visit.
onMount(() => {
	invalidate("app:notifications");
});

function notificationText(type: string, username: string): string {
	switch (type) {
		case "follow":
			return `${username} followed you`;
		case "follow_request":
			return `${username} requested to follow you`;
		case "follow_accepted":
			return `${username} accepted your follow request`;
		default:
			return `${username} interacted with you`;
	}
}

function timeAgo(date: Date): string {
	const diff = Date.now() - new Date(date).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}
</script>

<div>
	<header class="mb-10">
		<h1 class="m-0 font-display text-4xl tracking-tight sm:text-5xl">Notifications</h1>
		<div class="mt-4 flex items-center gap-3" aria-hidden="true">
			<span class="h-0.5 w-10 rounded-full bg-accent"></span>
			<span class="h-px flex-1 bg-border"></span>
		</div>
	</header>

	{#if notifications.length === 0}
		<p class="py-12 text-center text-text-muted">No notifications yet.</p>
	{:else}
		<ul class="m-0 list-none p-0">
			{#each notifications as n (n.id)}
				<li class="flex items-center gap-3 border-b border-border/60 px-2 py-4 {n.read ? 'opacity-60' : ''}">
					{#if n.read}
						<span class="h-2 w-2 shrink-0"></span>
					{:else}
						<span class="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread"></span>
					{/if}
					<a href="/u/{n.actor.username}" class="flex shrink-0 items-center">
						{#if n.actor.image}
							<img src={n.actor.image} alt={n.actor.username} class="h-8 w-8 rounded-full object-cover" />
						{:else}
							<span
								class="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted"
							>
								{n.actor.username.charAt(0).toUpperCase()}
							</span>
						{/if}
					</a>
					<div class="min-w-0 flex-1">
						<a
							href="/u/{n.actor.username}"
							class="text-sm text-text no-underline transition-colors hover:text-accent"
						>
							{notificationText(n.type, n.actor.username)}
						</a>
						<p class="m-0 mt-0.5 text-xs text-text-muted">{timeAgo(n.createdAt)}</p>
					</div>

					{#if n.isPending}
						<div class="flex shrink-0 gap-2">
							<form method="POST" action="?/acceptRequest" use:enhance>
								<input type="hidden" name="followerId" value={n.actor.id} />
								<button
									type="submit"
									class="cursor-pointer rounded-sm border-none bg-accent px-3 py-1 font-inherit text-xs text-bg transition-opacity hover:opacity-90"
								>
									Accept
								</button>
							</form>
							<form method="POST" action="?/rejectRequest" use:enhance>
								<input type="hidden" name="followerId" value={n.actor.id} />
								<button
									type="submit"
									class="cursor-pointer rounded-sm border border-border bg-transparent px-3 py-1 font-inherit text-xs text-text-muted transition-colors hover:border-danger hover:text-danger"
								>
									Decline
								</button>
							</form>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
