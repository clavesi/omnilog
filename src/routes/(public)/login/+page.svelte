<script lang="ts">
import { enhance } from "$app/forms";
import type { ActionData, PageData } from "./$types";

let { form, data }: { form: ActionData; data: PageData } = $props();

// bg-surface keeps inputs on-theme; unset background renders white in most browsers.
const inputClass =
	"w-full rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent";
</script>

<svelte:head>
	<title>Log in · Omnilog</title>
</svelte:head>

<div class="mx-auto my-16 max-w-100 px-4">
	<h1>Welcome back</h1>

	{#if data.resetSuccess}
		<p class="mt-2 rounded-sm border border-accent px-3 py-2 text-sm text-accent">
			Password reset — log in with your new password.
		</p>
	{/if}

	<div class="mt-6 flex flex-col gap-3">
		<a
			href="/login/github?next={encodeURIComponent(data.next)}"
			class="flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-2.5 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
		>
			Continue with GitHub
		</a>
		<a
			href="/login/google?next={encodeURIComponent(data.next)}"
			class="flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-2.5 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
		>
			Continue with Google
		</a>
	</div>

	<div class="my-6 flex items-center gap-3 text-sm text-text-muted">
		<div class="h-px flex-1 bg-border"></div>
		or
		<div class="h-px flex-1 bg-border"></div>
	</div>

	<form method="post" use:enhance class="flex flex-col gap-4">
		<input type="hidden" name="next" value={data.next} />

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

		<label class="flex flex-col gap-1 text-sm text-text-muted">
			Password
			<input
				type="password"
				name="password"
				required
				autocomplete="current-password"
				class={inputClass}
			/>
		</label>

		<a href="/forgot-password" class="self-end text-sm text-accent no-underline hover:text-text">
			Forgot password?
		</a>

		{#if form?.message}
			<p class="m-0 text-danger">{form.message}</p>
		{/if}

		<button
			type="submit"
			class="cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 font-[inherit] text-bg transition-opacity hover:opacity-90"
		>
			Log in
		</button>
	</form>

	<p class="text-text-muted">
		Don't have an account?
		<a href="/signup?next={data.next}" class="text-accent no-underline hover:text-text">Sign up</a>
	</p>
</div>
