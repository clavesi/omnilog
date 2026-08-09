<script lang="ts">
/**
 * Shared log create/edit form. Pages supply a header; this component owns
 * field state and POST handling. Pass `initial` for edit mode (pre-filled values).
 */
import { enhance } from "$app/forms";
import { COMMENT_POLICY_OPTIONS, type CommentPolicy } from "$lib/comment-policy";
import { INPUT_CLASS } from "$lib/form-styles";
import type { LogFormInitial } from "$lib/types/log";
import Checkbox from "./Checkbox.svelte";
import StarRating from "./StarRating.svelte";
import TagInput from "./TagInput.svelte";

type Props = {
	today: string;
	cancelHref: string;
	submitLabel: string;
	form?: { error?: string } | null;
	returnTo?: string;
	initial?: LogFormInitial;
	/** The author's saved preference — the starting value when creating. */
	defaultCommentPolicy?: CommentPolicy;
	/**
	 * Offer "mark as completed". Off for part logs — finishing one episode
	 * doesn't finish the series, so the prompt would be actively misleading.
	 */
	offerMarkCompleted?: boolean;
	/** Whether the item is already marked completed, to skip a pointless prompt. */
	alreadyCompleted?: boolean;
	/** Comma-separated tags already on this log (edit mode). */
	initialTags?: string;
	/** The author's existing tags, offered as quick-add. */
	tagSuggestions?: string[];
};

let {
	today,
	cancelHref,
	submitLabel,
	form = null,
	returnTo,
	initial,
	defaultCommentPolicy = "everyone",
	offerMarkCompleted = false,
	alreadyCompleted = false,
	initialTags = "",
	tagSuggestions = [],
}: Props = $props();

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
let isRewatch = $state(initial?.isRewatch ?? false);
// Defaults on: logging a whole work usually does mean you finished it. It's
// a visible checkbox, so the assumption is always overridable.
let markCompleted = $state(true);
// svelte-ignore state_referenced_locally
let showReview = $state(initial?.showReview ?? false);
// Edit mode keeps the log's own policy; creating starts from the preference.
// svelte-ignore state_referenced_locally
let commentPolicy = $state<CommentPolicy>(initial?.commentPolicy ?? defaultCommentPolicy);
let submitting = $state(false);
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
			<Checkbox name="isPublic" bind:checked={isPublic} />
			Public — visible to others
		</label>
	</div>

	<div class="mb-6">
		<label class="flex cursor-pointer items-center gap-2 text-sm">
			<Checkbox name="isRewatch" bind:checked={isRewatch} />
			Rewatch — I've experienced this before
		</label>
	</div>

	{#if offerMarkCompleted && !alreadyCompleted}
		<div class="mb-6">
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<Checkbox name="markCompleted" bind:checked={markCompleted} />
				Mark as completed
			</label>
		</div>
	{/if}

	<section class="mb-6">
		<span class="mb-2 block text-sm font-medium">Tags</span>
		<TagInput initial={initialTags} suggestions={tagSuggestions} />
	</section>

	<fieldset class="mb-6 border-none p-0">
		<legend class="mb-2 block text-sm font-medium">Who can comment</legend>
		<div class="flex flex-wrap gap-2">
			{#each COMMENT_POLICY_OPTIONS as opt (opt.value)}
				<label
					class="cursor-pointer rounded-sm border px-3 py-1.5 text-sm transition-colors {commentPolicy ===
					opt.value
						? 'border-accent text-accent'
						: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
				>
					<input
						type="radio"
						name="commentPolicy"
						value={opt.value}
						bind:group={commentPolicy}
						class="sr-only"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<section class="mb-6">
		<label class="mb-2 block text-sm font-medium" for="loggedAt">Watched on</label>
		<input
			type="date"
			id="loggedAt"
			name="loggedAt"
			bind:value={loggedAt}
			max={today}
			class="{INPUT_CLASS} font-mono"
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
				class="mb-2 {INPUT_CLASS}"
			/>
			<textarea
				id="reviewBody"
				name="reviewBody"
				rows="6"
				placeholder="Your thoughts..."
				bind:value={reviewBody}
				class="mt-2 w-full resize-y {INPUT_CLASS}"
			></textarea>
			<label class="mt-3 flex items-center gap-2 text-sm text-text-muted">
				<Checkbox name="containsSpoilers" bind:checked={containsSpoilers} />
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
