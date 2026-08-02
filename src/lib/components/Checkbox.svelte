<script lang="ts">
import { Check } from "@lucide/svelte";
import { Checkbox } from "bits-ui";

let {
	checked = $bindable(false),
	name,
	value = "on",
	disabled = false,
	class: className = "",
}: {
	checked?: boolean;
	name?: string;
	value?: string;
	disabled?: boolean;
	class?: string;
} = $props();
</script>

<!--
	Wraps bits-ui Checkbox.Root with our design-system styling and a Lucide
	checkmark indicator. The hidden <input> that bits-ui injects handles form
	submission — name/value work exactly like a native checkbox.
-->
<Checkbox.Root
	bind:checked
	{name}
	{value}
	{disabled}
	class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border bg-bg transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50 {className}"
>
	{#snippet children({ checked: isChecked })}
		{#if isChecked}
			<Check size={11} class="text-bg" strokeWidth={3} aria-hidden="true" />
		{/if}
	{/snippet}
</Checkbox.Root>
