<script lang="ts">
/**
 * Shared log create/edit form. Pages supply a header; this component owns
 * field state and POST handling. Pass `initial` for edit mode (pre-filled values).
 */
import { enhance } from "$app/forms";
import type { LogFormInitial } from "$lib/types/log";
import StarRating from "./StarRating.svelte";

type Props = {
	today: string;
	cancelHref: string;
	submitLabel: string;
	form?: { error?: string } | null;
	returnTo?: string;
	initial?: LogFormInitial;
};

let { today, cancelHref, submitLabel, form = null, returnTo, initial }: Props = $props();

// One-time init from props — form fields are edited locally until submit.
// svelte-ignore state_referenced_locally
let rating = $state<number | null>(initial?.rating ?? null);
// svelte-ignore state_referenced_locally
let loggedAt = $state(initial?.loggedAt ?? today);
// svelte-ignore state_referenced_locally
let reviewBody = $state(initial?.reviewBody ?? "");
// svelte-ignore state_referenced_locally
let reviewTitle = $state(initial?.reviewTitle ?? "");
// svelte-ignore state_referenced_locally
let containsSpoilers = $state(initial?.containsSpoilers ?? false);
// svelte-ignore state_referenced_locally
let isPublic = $state(initial?.isPublic ?? true);
// svelte-ignore state_referenced_locally
let showReview = $state(initial?.showReview ?? false);
let submitting = $state(false);

const inputClass =
	"w-full rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent";
</script>

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
	{#if returnTo}
		<!-- Part log flows redirect back to the episode page after save. -->
		<input type="hidden" name="returnTo" value={returnTo} />
	{/if}

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
			class="{inputClass} font-mono"
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
				class="mb-2 {inputClass}"
			/>
			<textarea
				id="reviewBody"
				name="reviewBody"
				rows="6"
				placeholder="Your thoughts..."
				bind:value={reviewBody}
				class="mt-2 w-full resize-y {inputClass}"
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
		<a href={cancelHref} class="px-4 py-2.5 text-text-muted no-underline transition-colors hover:text-text">
			Cancel
		</a>
		<button
			type="submit"
			class="cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 font-[inherit] text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
			disabled={submitting}
		>
			{submitting ? "Saving..." : submitLabel}
		</button>
	</div>
</form>
