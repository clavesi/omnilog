<script lang="ts">
import { enhance } from "$app/forms";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import StarRating from "$lib/components/StarRating.svelte";

let { data, form } = $props();

// svelte-ignore state_referenced_locally
let rating = $state<number | null>(data.log.rating);
// svelte-ignore state_referenced_locally
let loggedAt = $state(data.log.loggedAt ?? "");
// svelte-ignore state_referenced_locally
let reviewBody = $state(data.log.reviewBody ?? "");
// svelte-ignore state_referenced_locally
let reviewTitle = $state(data.log.reviewTitle ?? "");
// svelte-ignore state_referenced_locally
let containsSpoilers = $state(data.log.containsSpoilers);
// svelte-ignore state_referenced_locally
let isPublic = $state(data.log.isPublic);
// svelte-ignore state_referenced_locally
let showReview = $state(!!data.log.reviewBody);
let submitting = $state(false);
</script>

<div>
	<header class="mb-8 flex items-start gap-4 border-b border-border pb-8">
		<div class="flex shrink-0 gap-1.5">
			<MediaTypeMark mediaType={data.item.mediaType} variant="tab" />
			{#if data.item.coverImageUrl}
				<img src={data.item.coverImageUrl} alt="" class="h-24 w-16 rounded-sm object-cover" />
			{/if}
		</div>
		<div>
			<p class="mb-1 font-mono text-xs tracking-wider text-text-muted uppercase">Edit log</p>
			<h1 class="text-xl">
				{data.item.title}
				<span class="font-mono text-text-muted">
					— {data.part.partNumber}. {data.part.title}
				</span>
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
		<input type="hidden" name="returnTo" value={data.returnTo} />

		<section class="mb-6">
			<label class="mb-2 block text-sm font-medium" for="rating">Rating</label>
			<StarRating bind:value={rating} id="rating" />
		</section>

		<section class="mb-6">
			<label class="mb-2 block text-sm font-medium" for="loggedAt">Watched on</label>
			<input
				type="date"
				id="loggedAt"
				name="loggedAt"
				bind:value={loggedAt}
				max={data.today}
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
					class="w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent"
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

		<section class="mb-6">
			<label class="flex items-center gap-2 text-sm text-text-muted">
				<input
					type="checkbox"
					name="isPublic"
					bind:checked={isPublic}
					class="rounded-sm border-border text-accent focus:ring-accent"
				/>
				Public — visible to others
			</label>
		</section>

		{#if form?.error}
			<p class="mb-4 text-danger">{form.error}</p>
		{/if}

		<div class="flex justify-end gap-3 border-t border-border pt-6">
			<a
				href={data.returnTo}
				class="px-4 py-2.5 text-text-muted no-underline transition-colors hover:text-text"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
				disabled={submitting}
			>
				{submitting ? "Saving..." : "Save changes"}
			</button>
		</div>
	</form>
</div>
