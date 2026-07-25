<script lang="ts">
import { enhance } from "$app/forms";

let { form } = $props();

const inputClass =
	"w-full rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent";

let submitting = $state(false);
</script>

<svelte:head>
	<title>Forgot password · Omnilog</title>
</svelte:head>

<div class="mx-auto my-16 max-w-100 px-4">
	<h1>Reset your password</h1>

	{#if form?.success}
		<p class="mt-6 text-text">
			If that email has an Omnilog account, a reset link is on its way — check your inbox.
		</p>
	{:else}
		<p class="mt-2 text-text-muted">Enter your email and we'll send a link to reset your password.</p>

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
			<label class="flex flex-col gap-1 text-sm text-text-muted">
				Email
				<input
					type="email"
					name="email"
					value={form?.email ?? ""}
					required
					autocomplete="email"
					class={inputClass}
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
				{submitting ? "Sending..." : "Send reset link"}
			</button>
		</form>
	{/if}

	<p class="text-text-muted">
		<a href="/login" class="text-accent no-underline hover:text-text">Back to log in</a>
	</p>
</div>
