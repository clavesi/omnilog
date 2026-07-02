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

$effect(() => {
	loggedAt = today;
});

const year = $derived(data.item.releaseDate ? data.item.releaseDate.slice(0, 4) : null);
</script>

<main class="log-page">
    <header class="header">
        {#if data.item.coverImageUrl}
            <img class="poster" src={data.item.coverImageUrl} alt="" />
        {/if}
        <div>
            <p class="eyebrow">{data.hasPriorLog ? "Logging again" : "Log"}</p>
            <h1>
                {data.item.title}
                {#if year}
                    <span class="year">({year})</span>{/if}
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
        <section class="field">
            <label class="label" for="rating">Rating</label>
            <StarRating bind:value={rating} id="rating" />
        </section>

        <section class="field">
            <label class="label" for="loggedAt">Watched on</label>
            <input
                type="date"
                id="loggedAt"
                name="loggedAt"
                bind:value={loggedAt}
                max={today}
            />
        </section>

        <section class="field">
            {#if !showReview}
                <button
                    type="button"
                    class="add-review"
                    onclick={() => (showReview = true)}
                >
                    + Add a review
                </button>
            {:else}
                <label class="label" for="reviewBody">Review</label>
                <input
                    type="text"
                    name="reviewTitle"
                    placeholder="Title (optional)"
                    bind:value={reviewTitle}
                    class="title-input"
                />
                <textarea
                    id="reviewBody"
                    name="reviewBody"
                    rows="6"
                    placeholder="Your thoughts..."
                    bind:value={reviewBody}
                ></textarea>
                <label class="checkbox">
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
            <p class="error">{form.error}</p>
        {/if}

        <div class="actions">
            <a href="/media/{data.item.slug}" class="cancel">Cancel</a>
            <button type="submit" class="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save log"}
            </button>
        </div>
    </form>
</main>

<style>
    .log-page {
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
    }
    .header {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        align-items: center;
    }
    .poster {
        width: 64px;
        height: 96px;
        object-fit: cover;
        border-radius: 0.25rem;
    }
    .eyebrow {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        color: #666;
        margin: 0 0 0.25rem;
    }
    h1 {
        margin: 0;
        font-size: 1.5rem;
    }
    .year {
        color: #666;
        font-weight: 400;
    }
    .field {
        margin-bottom: 1.5rem;
    }
    .label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
    input[type="date"],
    textarea,
    .title-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        font: inherit;
        border: 1px solid #ccc;
        border-radius: 0.375rem;
    }
    textarea {
        resize: vertical;
        font-family: inherit;
        margin-top: 0.5rem;
    }
    .title-input {
        margin-bottom: 0.5rem;
    }
    .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        font-size: 0.875rem;
        color: #444;
    }
    .add-review {
        background: none;
        border: 1px dashed #ccc;
        padding: 0.75rem 1rem;
        border-radius: 0.375rem;
        color: #555;
        cursor: pointer;
        width: 100%;
    }
    .add-review:hover {
        background: #f5f5f5;
    }
    .error {
        color: #c33;
        margin-bottom: 1rem;
    }
    .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        align-items: center;
    }
    .cancel {
        color: #666;
        text-decoration: none;
        padding: 0.625rem 1rem;
    }
    .cancel:hover {
        color: #333;
    }
    .submit {
        padding: 0.625rem 1.5rem;
        font: inherit;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
    }
    .submit:hover:not(:disabled) {
        background: #1d4ed8;
    }
    .submit:disabled {
        opacity: 0.6;
        cursor: wait;
    }
</style>
