<script lang="ts">
import { enhance } from "$app/forms";

let { data, form } = $props();

let search = $state("");
let togglingId = $state<string | null>(null);

const filtered = $derived.by(() => {
	const q = search.trim().toLowerCase();
	if (!q) return data.users;
	return data.users.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
});

// Owner/admins float to the top, separated from regular users, so the
// people with actual power on the site are easy to scan at a glance.
const elevated = $derived(filtered.filter((u) => u.role !== "user"));
const regular = $derived(filtered.filter((u) => u.role === "user"));

function roleLabel(role: string): string {
	return role === "owner" ? "Owner" : role === "admin" ? "Admin" : "";
}
</script>

{#snippet userRow(user: (typeof data.users)[number])}
	<li class="flex items-center justify-between gap-4 py-4">
		<div>
			<p class="m-0 font-display font-medium text-text">
				{user.username}
				{#if user.role !== "user"}
					<span class="ml-1 rounded-sm border border-accent px-1.5 py-0.5 font-mono text-xs text-accent">
						{roleLabel(user.role)}
					</span>
				{/if}
			</p>
			<p class="m-0 mt-0.5 font-mono text-sm text-text-muted">{user.email}</p>
		</div>

		{#if user.id === data.currentUserId}
			<span class="font-mono text-sm text-text-muted">(you)</span>
		{:else if data.isOwner && user.role !== "owner"}
			<form
				method="POST"
				action="?/toggleAdmin"
				use:enhance={({ cancel }) => {
					const verb = user.role === "admin" ? "Remove admin from" : "Make";
					const suffix = user.role === "admin" ? "" : " an admin";
					if (!confirm(`${verb} ${user.username}${suffix}?`)) {
						cancel();
						return;
					}
					togglingId = user.id;
					return async ({ update }) => {
						await update();
						togglingId = null;
					};
				}}
			>
				<input type="hidden" name="userId" value={user.id} />
				<button
					type="submit"
					disabled={togglingId === user.id}
					class="rounded-sm border border-border px-4 py-2 text-sm text-text no-underline transition-colors hover:border-text-muted hover:bg-surface disabled:opacity-60"
				>
					{togglingId === user.id ? "Saving..." : user.role === "admin" ? "Remove admin" : "Make admin"}
				</button>
			</form>
		{/if}
	</li>
{/snippet}

<div>
	<h1 class="mb-2 text-2xl">Admin</h1>
	<p class="mb-6 text-sm text-text-muted">
		{data.isOwner
			? "Manage who can create and edit story arcs/sagas."
			: "Only the owner can change admin status — you can view but not change roles."}
	</p>

	<input
		type="text"
		bind:value={search}
		placeholder="Search by username or email..."
		class="mb-8 w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
	/>

	{#if form?.error}
		<p class="mb-6 text-sm text-danger">{form.error}</p>
	{/if}

	{#if filtered.length === 0}
		<p class="text-text-muted">No users match "{search}".</p>
	{:else}
		{#if elevated.length > 0}
			<ul class="m-0 list-none divide-y divide-border p-0">
				{#each elevated as user (user.id)}
					{@render userRow(user)}
				{/each}
			</ul>
		{/if}

		{#if elevated.length > 0 && regular.length > 0}
			<div class="my-2 border-t border-border"></div>
		{/if}

		{#if regular.length > 0}
			<ul class="m-0 list-none divide-y divide-border p-0">
				{#each regular as user (user.id)}
					{@render userRow(user)}
				{/each}
			</ul>
		{/if}
	{/if}
</div>
