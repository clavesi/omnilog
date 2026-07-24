<script lang="ts">
import { enhance } from "$app/forms";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data, form } = $props();

let editingMeta = $state(false);
let editTitle = $state("");
let editDescription = $state("");
let editPublic = $state(true);
let submitting = $state(false);
let showDeleteConfirm = $state(false);

function startEditingMeta() {
	editTitle = data.list.title;
	editDescription = data.list.description ?? "";
	editPublic = data.list.isPublic;
	editingMeta = true;
}
</script>

<div>
	{#if editingMeta}
		<form
			method="POST"
			action="?/updateMeta"
			use:enhance={() => {
				submitting = true;
				return async ({ update, result }) => {
					await update();
					submitting = false;
					if (result.type === "success") editingMeta = false;
				};
			}}
			class="mb-8 flex flex-col gap-4 rounded-sm border border-border p-4"
		>
			<label class="flex flex-col gap-1 text-sm">
				Title
				<input
					type="text"
					name="title"
					bind:value={editTitle}
					required
					class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Description
				<textarea
					name="description"
					bind:value={editDescription}
					rows="3"
					class="w-full resize-y rounded-sm border border-border bg-bg px-3 py-2 text-text"
				></textarea>
			</label>
			<label class="flex items-center gap-2 text-sm text-text-muted">
				<input type="checkbox" name="isPublic" bind:checked={editPublic} />
				Public
			</label>
			<div class="flex gap-3">
				<button
					type="submit"
					disabled={submitting}
					class="rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
				>
					{submitting ? "Saving..." : "Save"}
				</button>
				<button type="button" class="px-3 py-2 text-sm text-text-muted hover:text-text" onclick={() => (editingMeta = false)}>
					Cancel
				</button>
			</div>
		</form>
	{:else}
		<div class="mb-8 flex items-start justify-between gap-4">
			<div>
				<h1 class="mb-2 text-2xl">
					{data.list.title}
					{#if !data.list.isPublic}
						<span class="ml-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-text-muted">
							Private
						</span>
					{/if}
				</h1>
				{#if data.list.description}
					<p class="max-w-150 text-text-muted">{data.list.description}</p>
				{/if}
			</div>
			{#if data.isOwner}
				<div class="flex shrink-0 gap-3">
					<button
						type="button"
						class="rounded-sm border border-border px-4 py-2 text-sm text-text transition-colors hover:border-text-muted hover:bg-surface"
						onclick={startEditingMeta}
					>
						Edit
					</button>
					<button
						type="button"
						class="rounded-sm border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-danger hover:text-danger"
						onclick={() => (showDeleteConfirm = true)}
					>
						Delete
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if showDeleteConfirm}
		<div class="mb-8 rounded-sm border border-danger p-4">
			<p class="mb-3 text-sm text-text">Delete "{data.list.title}"? This can't be undone.</p>
			<div class="flex gap-3">
				<form method="POST" action="?/delete">
					<button type="submit" class="rounded-sm bg-danger px-4 py-2 text-sm text-bg transition-opacity hover:opacity-90">
						Delete list
					</button>
				</form>
				<button
					type="button"
					class="px-3 py-2 text-sm text-text-muted hover:text-text"
					onclick={() => (showDeleteConfirm = false)}
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<p class="mb-6 text-sm text-danger">{form.error}</p>
	{/if}

	{#if data.items.length === 0}
		<p class="text-text-muted">
			No items yet. {data.isOwner ? "Add some from any media page." : ""}
		</p>
	{:else}
		<ol class="m-0 list-none divide-y divide-border p-0">
			{#each data.items as item, i (item.id)}
				<li class="flex items-center gap-4 py-4">
					<span class="w-6 shrink-0 font-mono text-sm text-text-muted">{i + 1}</span>
					<div class="flex gap-2">
						<MediaTypeMark mediaType={item.mediaType} variant="tab" />
						{#if item.coverImageUrl}
							<img src={item.coverImageUrl} alt="" class="h-21 w-14 rounded-sm object-cover" />
						{:else}
							<div class="flex h-21 w-14 items-center justify-center rounded-sm border border-border bg-surface text-text-muted">
								?
							</div>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<a
							href="/media/{item.slug}"
							class="m-0 font-display font-medium text-text no-underline hover:text-accent"
						>
							{item.title}
						</a>
						{#if item.note}
							<p class="m-0 mt-0.5 text-sm text-text-muted">{item.note}</p>
						{/if}
					</div>
					{#if data.isOwner}
						<div class="flex shrink-0 items-center gap-1">
							<form method="POST" action="?/moveItem" use:enhance>
								<input type="hidden" name="itemId" value={item.id} />
								<input type="hidden" name="direction" value="up" />
								<button
									type="submit"
									disabled={i === 0}
									class="rounded-sm border border-border px-2 py-1 text-xs text-text-muted hover:text-text disabled:opacity-30"
								>
									↑
								</button>
							</form>
							<form method="POST" action="?/moveItem" use:enhance>
								<input type="hidden" name="itemId" value={item.id} />
								<input type="hidden" name="direction" value="down" />
								<button
									type="submit"
									disabled={i === data.items.length - 1}
									class="rounded-sm border border-border px-2 py-1 text-xs text-text-muted hover:text-text disabled:opacity-30"
								>
									↓
								</button>
							</form>
							<form method="POST" action="?/removeItem" use:enhance>
								<input type="hidden" name="mediaItemId" value={item.mediaItemId} />
								<button
									type="submit"
									class="ml-2 rounded-sm border border-border px-3 py-1 text-xs text-text-muted hover:border-danger hover:text-danger"
								>
									Remove
								</button>
							</form>
						</div>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</div>
