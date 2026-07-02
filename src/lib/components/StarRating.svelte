<script lang="ts">
type Props = {
	value: number | null;
	name?: string;
	id?: string;
	size?: number;
};

let { value = $bindable(null), name = "rating", id = "rating", size = 32 }: Props = $props();

let hover = $state<number | null>(null);
let displayValue = $derived(hover ?? value ?? 0);

function setRating(v: number) {
	value = value === v ? null : v; // Click same value to clear
}

// How much of star at `position` (1-5) should be gold-filled.
function fillPercent(position: number): number {
	const full = position * 2; // e.g. star 3 is fully filled at value 6
	if (displayValue >= full) return 100;
	if (displayValue === full - 1) return 50;
	return 0;
}

const STAR_PATH = "M12 2 L15 9 L22 10 L17 14.5 L18.5 21.5 L12 17.5 L5.5 21.5 L7 14.5 L2 10 L9 9 Z";
</script>

<div class="rating" style="--star-size: {size}px;">
    <input type="hidden" {name} {id} value={value ?? ""} />

    <div
        class="stars"
        role="radiogroup"
        aria-label="Rating"
        tabindex="0"
        onmouseleave={() => (hover = null)}
    >
        {#each [1, 2, 3, 4, 5] as position (position)}
            <div class="star-wrapper">
                <!-- Empty star (gray background) -->
                <svg
                    class="star star-bg"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d={STAR_PATH} />
                </svg>

                <!-- Fill overlay (clipped to 0/50/100% width) -->
                <div class="fill" style="width: {fillPercent(position)}%">
                    <svg
                        class="star star-fill"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d={STAR_PATH} />
                    </svg>
                </div>

                <!-- Left half click zone -->
                <button
                    type="button"
                    class="click-zone left"
                    aria-label="{position - 0.5} stars"
                    onmouseenter={() => (hover = position * 2 - 1)}
                    onclick={() => setRating(position * 2 - 1)}
                ></button>

                <!-- Right half click zone -->
                <button
                    type="button"
                    class="click-zone right"
                    aria-label="{position} stars"
                    onmouseenter={() => (hover = position * 2)}
                    onclick={() => setRating(position * 2)}
                ></button>
            </div>
        {/each}
    </div>

    <span class="value">
        {#if displayValue > 0}
            {(displayValue / 2).toFixed(1)} / 5
        {:else}
            Not rated
        {/if}
    </span>

    {#if value !== null}
        <button type="button" class="clear" onclick={() => (value = null)}
            >Clear</button
        >
    {/if}
</div>

<style>
    .rating {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    .stars {
        display: inline-flex;
        gap: 2px;
    }
    .star-wrapper {
        position: relative;
        width: var(--star-size);
        height: var(--star-size);
    }
    .star {
        width: var(--star-size);
        height: var(--star-size);
        display: block;
    }
    .star-bg {
        fill: #d1d5db;
    }
    .fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        transition: width 0.05s ease;
    }
    .star-fill {
        fill: #f59e0b;
    }
    .click-zone {
        position: absolute;
        top: 0;
        height: 100%;
        width: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
    }
    .click-zone.left {
        left: 0;
    }
    .click-zone.right {
        left: 50%;
    }
    .value {
        color: #555;
        font-size: 0.875rem;
        min-width: 4.5rem;
    }
    .clear {
        background: none;
        border: none;
        color: #888;
        font-size: 0.8125rem;
        cursor: pointer;
        text-decoration: underline;
    }
    .clear:hover {
        color: #333;
    }
</style>
