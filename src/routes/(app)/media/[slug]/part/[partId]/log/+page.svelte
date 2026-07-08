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
let isPublic = $state(true);
let showReview = $state(false);
let submitting = $state(false);

$effect(() => {
	loggedAt = today;
});
</script>

<main class="mx-auto my-8 max-w-[600px] px-4">
    <header class="mb-6 flex items-center gap-4">
        {#if data.item.coverImageUrl}
            <img
                src={data.item.coverImageUrl}
                alt=""
                class="h-24 w-16 rounded object-cover"
            />
        {/if}
        <div>
            <p class="mb-1 text-xs tracking-wide text-gray-500 uppercase">
                {data.hasPriorLog ? "Logging again" : "Log"}
            </p>
            <h1 class="text-xl font-semibold">
                {data.item.title} — {data.part.partNumber}. {data.part.title}
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
            <label class="mb-2 block font-medium" for="rating">Rating</label>
            <StarRating bind:value={rating} id="rating" />
        </section>

        <section class="mb-6">
            <label class="mb-2 block font-medium" for="loggedAt"
                >Watched on</label
            >
            <input
                type="date"
                id="loggedAt"
                name="loggedAt"
                bind:value={loggedAt}
                max={data.today}
                class="w-full rounded border border-gray-300 px-3 py-2"
            />
        </section>

        <section class="mb-6">
            {#if !showReview}
                <button
                    type="button"
                    class="w-full rounded border border-dashed border-gray-300 px-4 py-3 text-gray-500 hover:bg-gray-50"
                    onclick={() => (showReview = true)}
                >
                    + Add a review
                </button>
            {:else}
                <label class="mb-2 block font-medium" for="reviewBody"
                    >Review</label
                >
                <input
                    type="text"
                    name="reviewTitle"
                    placeholder="Title (optional)"
                    bind:value={reviewTitle}
                    class="mb-2 w-full rounded border border-gray-300 px-3 py-2"
                />
                <textarea
                    id="reviewBody"
                    name="reviewBody"
                    rows="6"
                    placeholder="Your thoughts..."
                    bind:value={reviewBody}
                    class="w-full rounded border border-gray-300 px-3 py-2"
                ></textarea>
                <label class="mt-3 flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="containsSpoilers"
                        bind:checked={containsSpoilers}
                    />
                    Contains spoilers
                </label>
            {/if}
        </section>

        <section class="mb-6">
            <label class="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    name="isPublic"
                    bind:checked={isPublic}
                />
                Public — visible to others
            </label>
        </section>

        {#if form?.error}
            <p class="mb-4 text-red-600">{form.error}</p>
        {/if}

        <div class="flex justify-end gap-3">
            <a
                href={data.returnTo}
                class="px-4 py-2.5 text-gray-600 hover:text-gray-900">Cancel</a
            >
            <button
                type="submit"
                class="rounded bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={submitting}
            >
                {submitting ? "Saving..." : "Save log"}
            </button>
        </div>
    </form>
</main>
