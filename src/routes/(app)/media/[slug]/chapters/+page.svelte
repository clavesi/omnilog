<script lang="ts">
import { enhance } from "$app/forms";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data, form } = $props();

let chapterNumber = $state("");
let title = $state("");
let submitting = $state(false);
</script>

<div>
	<p class="mb-2 flex items-center gap-2 text-sm text-text-muted">
		<MediaTypeMark mediaType={data.item.mediaType} variant="dot" />
		<a href="/media/{data.item.slug}" class="text-accent no-underline hover:text-text">
			{data.item.title}
		</a>
	</p>
	<h1 class="mb-2 text-2xl">Chapters</h1>
	<p class="mb-8 text-sm text-text-muted">
		No chapter data source exists for manga — chapters are added by readers as they go. Check the
		list below before adding one, since it might already exist.
	</p>

	<form
		method="POST"
		action="?/addChapter"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="mb-10 flex flex-wrap items-end gap-3 rounded-sm border border-border p-4"
	>
		<input type="hidden" name="returnTo" value="/media/{data.item.slug}/chapters" />
		<label class="flex flex-col gap-1 text-sm">
			Chapter #
			<input
				type="number"
				name="chapterNumber"
				min="1"
				step="1"
				bind:value={chapterNumber}
				required
				class="w-24 rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<label class="flex flex-1 flex-col gap-1 text-sm">
			Title (optional)
			<input
				type="text"
				name="title"
				bind:value={title}
				placeholder="e.g. The Reckoning"
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<button
			type="submit"
			disabled={submitting}
			class="rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
		>
			{submitting ? "Adding..." : "Add chapter"}
		</button>
	</form>

	{#if form?.error}
		<p class="mb-6 text-sm text-danger">{form.error}</p>
	{/if}

	{#if data.chapters.length === 0}
		<p class="text-text-muted">No chapters logged yet. Add the first one above.</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-border p-0">
			{#each data.chapters as chapter (chapter.id)}
				<li class="flex items-center justify-between gap-4 py-4">
					<div class="flex min-w-0 items-start gap-3">
						<span class="mt-0.5 shrink-0 font-mono text-sm text-text-muted">
							{String(chapter.number).padStart(3, "0")}
						</span>
						<a
							href="/media/{data.item.slug}/part/{chapter.id}"
							class="m-0 min-w-0 truncate font-display font-medium text-text no-underline hover:text-accent"
						>
							{chapter.title ?? `Chapter ${chapter.number}`}
						</a>
						{#if chapter.averageRating}
							<span class="shrink-0 font-mono text-sm text-text">
								★ {chapter.averageRating} ({chapter.ratingCount})
							</span>
						{/if}
					</div>
					<a
						href={chapter.existingLogId
							? `/media/${data.item.slug}/part/${chapter.id}/log/${chapter.existingLogId}/edit?returnTo=${encodeURIComponent(`/media/${data.item.slug}/chapters`)}`
							: `/media/${data.item.slug}/part/${chapter.id}/log?returnTo=${encodeURIComponent(`/media/${data.item.slug}/chapters`)}`}
						class="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
					>
						{chapter.existingLogId ? "Edit" : "Log"}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>