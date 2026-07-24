<script lang="ts">
import { enhance } from "$app/forms";

let { form } = $props();

let submitting = $state(false);
</script>

<div class="mx-auto max-w-150">
	<h1 class="mb-6 text-2xl">New list</h1>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="flex flex-col gap-4"
	>
		<label class="flex flex-col gap-1 text-sm">
			Title
			<input
				type="text"
				name="title"
				placeholder="e.g. Best Villain Arcs"
				required
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Description (optional)
			<textarea
				name="description"
				rows="3"
				placeholder="What's this list about?"
				class="w-full resize-y rounded-sm border border-border bg-bg px-3 py-2 text-text"
			></textarea>
		</label>
		<label class="flex items-center gap-2 text-sm text-text-muted">
			<input type="checkbox" name="isPublic" checked />
			Public
		</label>

		{#if form?.error}
			<p class="text-sm text-danger">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="mt-2 self-start rounded-sm bg-accent px-6 py-2.5 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
		>
			{submitting ? "Creating..." : "Create list"}
		</button>
	</form>
</div>
