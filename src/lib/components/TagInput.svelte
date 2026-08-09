<script lang="ts">
import { X } from "@lucide/svelte";
import { isValidTag, MAX_TAG_LENGTH, MAX_TAGS_PER_LOG, parseTagList, tagDisplayName, tagSlug } from "$lib/tags";

type Props = {
	/** Comma-separated starting value, as stored by the edit form. */
	initial?: string;
	/** The author's existing tags, offered as autocomplete. */
	suggestions?: string[];
};

let { initial = "", suggestions = [] }: Props = $props();

// svelte-ignore state_referenced_locally
let chips = $state<string[]>(parseTagList(initial));
let draft = $state("");

const atLimit = $derived(chips.length >= MAX_TAGS_PER_LOG);

// The single source of truth for the form submission — chips are UI state,
// this hidden field is what the server parses.
const serialized = $derived(chips.join(", "));

// Don't re-suggest something already applied.
const available = $derived(suggestions.filter((s) => !chips.some((c) => tagSlug(c) === tagSlug(s))).slice(0, 12));

function add(raw: string) {
	if (atLimit) return;
	const name = tagDisplayName(raw);
	if (!isValidTag(name)) return;
	if (chips.some((c) => tagSlug(c) === tagSlug(name))) return;
	chips = [...chips, name];
	draft = "";
}

function remove(index: number) {
	chips = chips.filter((_, i) => i !== index);
}

function onKeydown(e: KeyboardEvent) {
	// Enter and comma both commit — comma because people type tag lists that
	// way by habit, Enter because it's the obvious key. Enter is prevented so
	// it can't submit the surrounding form mid-entry.
	if (e.key === "Enter" || e.key === ",") {
		e.preventDefault();
		add(draft);
		return;
	}
	// Backspace on an empty field removes the last chip.
	if (e.key === "Backspace" && draft === "" && chips.length > 0) {
		remove(chips.length - 1);
	}
}

// Pasting "a, b, c" should produce three chips, not one.
function onPaste(e: ClipboardEvent) {
	const text = e.clipboardData?.getData("text") ?? "";
	if (!text.includes(",")) return;
	e.preventDefault();
	for (const name of parseTagList(text)) add(name);
}
</script>

<input type="hidden" name="tags" value={serialized} />

<div class="rounded-sm border border-border bg-surface px-2 py-2">
	<div class="flex flex-wrap items-center gap-1.5">
		{#each chips as chip, i (chip)}
			<span class="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-sm text-text">
				{chip}
				<button
					type="button"
					aria-label="Remove tag {chip}"
					class="cursor-pointer border-none bg-transparent p-0 text-text-muted hover:text-danger"
					onclick={() => remove(i)}
				>
					<X size={13} aria-hidden="true" />
				</button>
			</span>
		{/each}

		<input
			type="text"
			bind:value={draft}
			onkeydown={onKeydown}
			onpaste={onPaste}
			onblur={() => add(draft)}
			maxlength={MAX_TAG_LENGTH}
			disabled={atLimit}
			placeholder={atLimit ? `Limit ${MAX_TAGS_PER_LOG} tags` : "Add a tag..."}
			class="min-w-32 flex-1 border-none bg-transparent p-0 text-sm text-text placeholder:text-text-muted focus:ring-0"
		/>
	</div>
</div>

{#if available.length > 0 && !atLimit}
	<div class="mt-2 flex flex-wrap gap-1.5">
		<span class="font-mono text-xs text-text-muted">Recent</span>
		{#each available as s (s)}
			<button
				type="button"
				class="cursor-pointer rounded-full border border-border px-2 py-0.5 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent"
				onclick={() => add(s)}
			>
				{s}
			</button>
		{/each}
	</div>
{/if}
