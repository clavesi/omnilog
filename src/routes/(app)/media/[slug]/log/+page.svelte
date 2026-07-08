<script lang="ts">
import { enhance } from "$app/forms";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import StarRating from "$lib/components/StarRating.svelte";

let { data, form } = $props();

const today = $derived(data.today);

let rating = $state<number | null>(null);
let loggedAt = $state("");
let reviewBody = $state("");
let reviewTitle = $state("");
let containsSpoilers = $state(false);
let showReview = $state(false);
let submitting = $state(false);
let isPublic = $state(true);

$effect(() => {
	loggedAt = today;
});

const year = $derived(data.item.releaseDate ? data.item.releaseDate.slice(0, 4) : null);
</script>

<div>
	<header class="mb-8 flex items-start gap-4 border-b border-border pb-8">
		<div class="flex shrink-0 gap-1.5">
			<MediaTypeMark mediaType={data.item.mediaType} variant="tab" />
			{#if data.item.coverImageUrl}
				<img class="h-24 w-16 rounded-sm object-cover" src={data.item.coverImageUrl} alt="" />
			{/if}
		</div>
		<div>
			<p class="mb-1 font-mono text-xs tracking-wider text-text-muted uppercase">
				{data.hasPriorLog ? "Logging again" : "Log"}
			</p>
			<h1 class="m-0 text-2xl">
				{data.item.title}
				{#if year}
					<span class="font-mono font-normal text-text-muted">({year})</span>
				{/if}
			</h1>
		</div>
	</header>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<section class="mb-6">
			<label class="mb-2 block text-sm font-medium" for="rating">Rating</label>
			<StarRating bind:value={rating} id="rating" />
		</section>

		<div class="mb-6">
			<label class="flex items-center gap-2 text-sm text-text-muted">
				<input
					type="checkbox"
					name="isPublic"
					value="on"
					bind:checked={isPublic}
					class="rounded-sm border-border text-accent focus:ring-accent"
				/>
				Public — visible to others
			</label>
		</div>

		<section class="mb-6">
			<label class="mb-2 block text-sm font-medium" for="loggedAt">Watched on</label>
			<input
				type="date"
				id="loggedAt"
				name="loggedAt"
				bind:value={loggedAt}
				max={today}
				class="w-full rounded-sm border border-border bg-surface px-3 py-2 font-mono text-text focus:border-accent focus:ring-1 focus:ring-accent"
			/>
		</section>

		<section class="mb-6">
			{#if !showReview}
				<button
					type="button"
					class="w-full cursor-pointer rounded-sm border border-dashed border-border px-4 py-3 text-text-muted transition-colors hover:border-text-muted hover:bg-surface hover:text-text"
					onclick={() => (showReview = true)}
				>
					+ Add a review
				</button>
			{:else}
				<label class="mb-2 block text-sm font-medium" for="reviewBody">Review</label>
				<input
					type="text"
					name="reviewTitle"
					placeholder="Title (optional)"
					bind:value={reviewTitle}
					class="mb-2 w-full rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent"
				/>
				<textarea
					id="reviewBody"
					name="reviewBody"
					rows="6"
					placeholder="Your thoughts..."
					bind:value={reviewBody}
					class="mt-2 w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent"
				></textarea>
				<label class="mt-3 flex items-center gap-2 text-sm text-text-muted">
					<input
						type="checkbox"
						name="containsSpoilers"
						bind:checked={containsSpoilers}
						class="rounded-sm border-border text-accent focus:ring-accent"
					/>
					Contains spoilers
				</label>
			{/if}
		</section>

		{#if form?.error}
			<p class="mb-4 text-danger">{form.error}</p>
		{/if}

		<div class="flex items-center justify-end gap-3 border-t border-border pt-6">
			<a
				href="/media/{data.item.slug}"
				class="px-4 py-2.5 text-text-muted no-underline transition-colors hover:text-text"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 font-[inherit] text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
				disabled={submitting}
			>
				{submitting ? "Saving..." : "Save log"}
			</button>
		</div>
	</form>
</div>
