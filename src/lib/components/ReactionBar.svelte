<script lang="ts">
import { enhance } from "$app/forms";
import { REACTIONS, reactionLabel } from "$lib/reactions";

type Summary = { emoji: string; count: number; reacted: boolean };

type Props = {
	reactions: Summary[];
	/** False for signed-out viewers — existing reactions still render. */
	canReact: boolean;
};

/*
 * One reaction per person per log. Clicking the tally you're already part of
 * clears it; clicking a different tally switches to that one. The picker only
 * needs to offer emoji nobody has used yet, since anything already on the bar
 * can be switched to by clicking it directly.
 */

let { reactions, canReact }: Props = $props();

let pickerOpen = $state(false);

// The picker offers only what isn't already on the bar, so a log doesn't
// show six mostly-empty buttons.
const used = $derived(new Set(reactions.map((r) => r.emoji)));
const unused = $derived(REACTIONS.filter((r) => !used.has(r.emoji)));
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each reactions as r (r.emoji)}
		{#if canReact}
			<form method="POST" action="?/react" use:enhance>
				<input type="hidden" name="emoji" value={r.emoji} />
				<button
					type="submit"
					title={reactionLabel(r.emoji)}
					aria-label="{reactionLabel(r.emoji)} ({r.count})"
					aria-pressed={r.reacted}
					class="flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-colors {r.reacted
						? 'border-accent bg-accent/10 text-accent'
						: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
				>
					<span>{r.emoji}</span>
					<span class="font-mono text-xs">{r.count}</span>
				</button>
			</form>
		{:else}
			<span
				title={reactionLabel(r.emoji)}
				class="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm text-text-muted"
			>
				<span>{r.emoji}</span>
				<span class="font-mono text-xs">{r.count}</span>
			</span>
		{/if}
	{/each}

	{#if canReact && unused.length > 0}
		<div class="relative">
			<button
				type="button"
				aria-label="Add reaction"
				aria-expanded={pickerOpen}
				class="cursor-pointer rounded-full border border-border px-2.5 py-1 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text"
				onclick={() => (pickerOpen = !pickerOpen)}
			>
				+
			</button>

			{#if pickerOpen}
				<div
					class="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-sm border border-border bg-surface p-1.5 shadow-md"
				>
					{#each unused as r (r.emoji)}
						<form
							method="POST"
							action="?/react"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false });
									pickerOpen = false;
								};
							}}
						>
							<input type="hidden" name="emoji" value={r.emoji} />
							<button
								type="submit"
								title={r.label}
								aria-label={r.label}
								class="cursor-pointer rounded-sm border-none bg-transparent px-1.5 py-1 text-base transition-colors hover:bg-bg"
							>
								{r.emoji}
							</button>
						</form>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
