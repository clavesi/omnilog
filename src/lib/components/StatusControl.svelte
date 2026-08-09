<script lang="ts">
import { enhance } from "$app/forms";
import { MEDIA_STATUS_OPTIONS, type MediaStatus, progressUnit, supportsProgress } from "$lib/media-status";

type Props = {
	mediaType: string;
	current: { status: MediaStatus; progress: number | null } | null;
};

let { mediaType, current }: Props = $props();

// svelte-ignore state_referenced_locally
let progress = $state<number | string>(current?.progress ?? "");

const unit = $derived(progressUnit(mediaType));
const showProgress = $derived(supportsProgress(mediaType));

// Progress is only meaningful once something is underway — asking how many
// episodes into a "Planned" show you are makes no sense.
const progressRelevant = $derived(showProgress && (current?.status === "in_progress" || current?.status === "on_hold"));
</script>

<section class="mb-6">
	<span class="mb-2 block text-sm font-medium">Status</span>

	<form method="POST" action="?/setStatus" class="flex flex-wrap gap-2" use:enhance>
		{#each MEDIA_STATUS_OPTIONS as opt (opt.value)}
			<button
				type="submit"
				name="status"
				value={opt.value}
				class="cursor-pointer rounded-sm border px-3 py-1.5 text-sm transition-colors {current?.status ===
				opt.value
					? 'border-accent text-accent'
					: 'border-border text-text-muted hover:border-text-muted hover:text-text'}"
			>
				{opt.label}
			</button>
		{/each}

		{#if current}
			<button
				type="submit"
				name="status"
				value=""
				class="cursor-pointer rounded-sm border border-border bg-transparent px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-danger hover:text-danger"
			>
				Clear
			</button>
		{/if}
	</form>

	{#if progressRelevant && unit}
		<form method="POST" action="?/setStatus" class="mt-3 flex items-center gap-2" use:enhance>
			<!-- Resubmits the current status so the upsert doesn't reset it. -->
			<input type="hidden" name="status" value={current?.status} />
			<label class="text-sm text-text-muted" for="progress">{unit.plural}</label>
			<input
				id="progress"
				type="number"
				name="progress"
				min="0"
				step="1"
				bind:value={progress}
				class="w-24 rounded-sm border border-border bg-surface px-2 py-1 text-sm text-text"
			/>
			<button
				type="submit"
				class="cursor-pointer rounded-sm border border-border bg-transparent px-3 py-1 font-inherit text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text"
			>
				Save
			</button>
		</form>
	{/if}
</section>
