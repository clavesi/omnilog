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

<div class="flex flex-wrap items-center gap-3">
	<input type="hidden" {name} {id} value={value ?? ""} />

	<div
		class="inline-flex gap-0.5"
		role="radiogroup"
		aria-label="Rating"
		tabindex="0"
		onmouseleave={() => (hover = null)}
	>
		{#each [1, 2, 3, 4, 5] as position (position)}
			<div class="relative" style="width: {size}px; height: {size}px;">
				<svg
					class="block fill-gray-300"
					style="width: {size}px; height: {size}px;"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d={STAR_PATH} />
				</svg>

				<div
					class="pointer-events-none absolute top-0 left-0 h-full overflow-hidden transition-[width] duration-75 ease-linear"
					style="width: {fillPercent(position)}%"
				>
					<svg
						class="block fill-amber-500"
						style="width: {size}px; height: {size}px;"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d={STAR_PATH} />
					</svg>
				</div>

				<button
					type="button"
					class="absolute top-0 left-0 h-full w-1/2 cursor-pointer border-none bg-transparent p-0"
					aria-label="{position - 0.5} stars"
					onmouseenter={() => (hover = position * 2 - 1)}
					onclick={() => setRating(position * 2 - 1)}
				></button>

				<button
					type="button"
					class="absolute top-0 left-1/2 h-full w-1/2 cursor-pointer border-none bg-transparent p-0"
					aria-label="{position} stars"
					onmouseenter={() => (hover = position * 2)}
					onclick={() => setRating(position * 2)}
				></button>
			</div>
		{/each}
	</div>

	<span class="min-w-18 text-sm text-gray-600">
		{#if displayValue > 0}
			{(displayValue / 2).toFixed(1)} / 5
		{:else}
			Not rated
		{/if}
	</span>

	{#if value !== null}
		<button
			type="button"
			class="cursor-pointer border-none bg-transparent text-[0.8125rem] text-gray-500 underline hover:text-gray-800"
			onclick={() => (value = null)}
		>
			Clear
		</button>
	{/if}
</div>
