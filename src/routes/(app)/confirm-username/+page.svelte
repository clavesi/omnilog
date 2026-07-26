<script lang="ts">
import { enhance } from "$app/forms";

let { data, form } = $props();

// svelte-ignore state_referenced_locally -- this page only ever loads
// once per visit; data won't change without a full remount.
let username = $state(data.suggestedUsername);
let submitting = $state(false);
</script>

<svelte:head>
	<title>Choose your username · Omnilog</title>
</svelte:head>

<div class="mx-auto my-16 max-w-100 px-4">
	<h1 class="mb-2 text-2xl">Choose your username</h1>
	<p class="mb-6 text-text-muted">
		This is your public handle on Omnilog — it shows up on your profile and everything you log.
		We picked a placeholder to get you started, but make it yours.
	</p>

	<form
		method="post"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="flex flex-col gap-4"
	>
		<label class="flex flex-col gap-1 text-sm text-text-muted">
			Username
			<input
				type="text"
				name="username"
				bind:value={username}
				required
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>

		{#if form?.message}
			<p class="m-0 text-sm text-danger">{form.message}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="self-start rounded-sm bg-accent px-6 py-2.5 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
		>
			{submitting ? "Saving..." : "Continue"}
		</button>
	</form>
</div>
