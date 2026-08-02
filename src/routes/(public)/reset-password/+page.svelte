<script lang="ts">
import { enhance } from "$app/forms";
import { INPUT_CLASS } from "$lib/form-styles";

let { data, form } = $props();

let submitting = $state(false);
</script>

<svelte:head>
	<title>Reset password · Omnilog</title>
</svelte:head>

<div class="mx-auto my-16 max-w-100 px-4">
	<h1>Set a new password</h1>

	{#if !data.token}
		<p class="mt-6 text-text">
			This link is missing a reset token. <a href="/forgot-password" class="text-accent no-underline hover:text-text">Request a new one</a>.
		</p>
	{:else}
		<form
			method="post"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="mt-6 flex flex-col gap-4"
		>
			<input type="hidden" name="token" value={data.token} />

			<label class="flex flex-col gap-1 text-sm text-text-muted">
				New password
				<input
					type="password"
					name="newPassword"
					required
					autocomplete="new-password"
					class={INPUT_CLASS}
				/>
			</label>

			<label class="flex flex-col gap-1 text-sm text-text-muted">
				Confirm new password
				<input
					type="password"
					name="confirmPassword"
					required
					autocomplete="new-password"
					class={INPUT_CLASS}
				/>
			</label>

			{#if form?.message}
				<p class="m-0 text-danger">{form.message}</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 font-[inherit] text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{submitting ? "Saving..." : "Set new password"}
			</button>
		</form>
	{/if}
</div>
