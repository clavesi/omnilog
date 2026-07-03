<script lang="ts">
import { enhance } from "$app/forms";
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

<main class="mx-auto my-8 max-w-[600px] px-4">
	<header class="mb-8 flex items-center gap-4">
		{#if data.item.coverImageUrl}
			<img class="h-24 w-16 rounded object-cover" src={data.item.coverImageUrl} alt="" />
		{/if}
		<div>
			<p class="mb-1 text-xs tracking-wider text-gray-500 uppercase">
				{data.hasPriorLog ? "Logging again" : "Log"}
			</p>
			<h1 class="m-0 text-2xl">
				{data.item.title}
				{#if year}
					<span class="font-normal text-gray-500">({year})</span>{/if}
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
			<label class="mb-2 block font-medium" for="rating">Rating</label>
			<StarRating bind:value={rating} id="rating" />
		</section>

		<div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" name="isPublic" value="on" bind:checked={isPublic} />
				Public — visible to others
			</label>
		</div>

		<section class="mb-6">
			<label class="mb-2 block font-medium" for="loggedAt">Watched on</label>
			<input
				type="date"
				id="loggedAt"
				name="loggedAt"
				bind:value={loggedAt}
				max={today}
				class="w-full rounded-md border border-gray-300 px-3 py-2 font-[inherit]"
			/>
		</section>

		<section class="mb-6">
			{#if !showReview}
				<button
					type="button"
					class="w-full cursor-pointer rounded-md border border-dashed border-gray-300 px-4 py-3 text-gray-600 hover:bg-gray-100"
					onclick={() => (showReview = true)}
				>
					+ Add a review
				</button>
			{:else}
				<label class="mb-2 block font-medium" for="reviewBody">Review</label>
				<input
					type="text"
					name="reviewTitle"
					placeholder="Title (optional)"
					bind:value={reviewTitle}
					class="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 font-[inherit]"
				/>
				<textarea
					id="reviewBody"
					name="reviewBody"
					rows="6"
					placeholder="Your thoughts..."
					bind:value={reviewBody}
					class="mt-2 w-full resize-y rounded-md border border-gray-300 px-3 py-2 font-[inherit]"
				></textarea>
				<label class="mt-3 flex items-center gap-2 text-sm text-gray-700">
					<input
						type="checkbox"
						name="containsSpoilers"
						bind:checked={containsSpoilers}
					/>
					Contains spoilers
				</label>
			{/if}
		</section>

		{#if form?.error}
			<p class="mb-4 text-red-600">{form.error}</p>
		{/if}

		<div class="flex items-center justify-end gap-3">
			<a
				href="/media/{data.item.slug}"
				class="px-4 py-2.5 text-gray-500 no-underline hover:text-gray-800">Cancel</a
			>
			<button
				type="submit"
				class="cursor-pointer rounded-md border-none bg-blue-600 px-6 py-2.5 font-[inherit] text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
				disabled={submitting}
			>
				{submitting ? "Saving..." : "Save log"}
			</button>
		</div>
	</form>
</main>
