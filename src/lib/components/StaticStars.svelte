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

const STAR_PATH = "M12 2 L15 9 L22 10 L17 14.5 L18.5 21.5 L12 17.5 L5.5 21.5 L7 14.5 L2 10 L9 9 Z";
</script>

{#if value !== null}
	<div class="stars" style="--star-size: {size}px;" aria-label="{value / 2} out of 5 stars">
		{#each [1, 2, 3, 4, 5] as position (position)}
			<div class="star-wrapper">
				<svg class="star star-bg" viewBox="0 0 24 24" aria-hidden="true">
					<path d={STAR_PATH} />
				</svg>
				<div class="fill" style="width: {fillPercent(position)}%">
					<svg class="star star-fill" viewBox="0 0 24 24" aria-hidden="true">
						<path d={STAR_PATH} />
					</svg>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.stars {
		display: inline-flex;
		gap: 1px;
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
	}
	.star-fill {
		fill: #f59e0b;
	}
</style>
