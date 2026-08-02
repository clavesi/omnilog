<!--
Read-only version of StarRating - no buttons, no hover, just renders a value.
-->
<script lang="ts">
import { STAR_PATH } from "$lib/star-path";

type Props = {
	value: number | null; // 1-10 scale
	size?: number;
};

let { value, size = 18 }: Props = $props();

function fillPercent(position: number): number {
	if (value === null) return 0;
	const full = position * 2;
	if (value >= full) return 100;
	if (value === full - 1) return 50;
	return 0;
}
</script>

{#if value !== null}
	<div class="inline-flex gap-px" aria-label="{value / 2} out of 5 stars">
		{#each [1, 2, 3, 4, 5] as position (position)}
			<div class="relative" style="width: {size}px; height: {size}px;">
				<svg
					class="block fill-star-empty"
					style="width: {size}px; height: {size}px;"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d={STAR_PATH} />
				</svg>
				<div
					class="absolute top-0 left-0 h-full overflow-hidden"
					style="width: {fillPercent(position)}%"
				>
					<svg
						class="block fill-accent"
						style="width: {size}px; height: {size}px;"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d={STAR_PATH} />
					</svg>
				</div>
			</div>
		{/each}
	</div>
{/if}
