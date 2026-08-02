<!--
Read-only version of StarRating - no buttons, no hover, just renders a value.
-->
<script lang="ts">
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

const STAR_PATH =
	"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";
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
