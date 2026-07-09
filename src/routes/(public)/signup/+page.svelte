<script lang="ts">
import { enhance } from "$app/forms";
import type { ActionData, PageData } from "./$types";

let { form, data }: { form: ActionData; data: PageData } = $props();

// bg-surface keeps inputs on-theme; unset background renders white in most browsers.
const inputClass =
	"w-full rounded-sm border border-border bg-surface px-3 py-2 font-[inherit] text-text focus:border-accent focus:ring-1 focus:ring-accent";
</script>

<svelte:head>
	<title>Sign up · Omnilog</title>
</svelte:head>

<div class="mx-auto my-16 max-w-[400px] px-4">
	<h1>Create your account</h1>

	<form method="post" use:enhance class="mt-6 flex flex-col gap-4">
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
			Username
			<input
				type="text"
				name="username"
				value={form?.username ?? ""}
				required
				autocomplete="username"
				minlength="3"
				maxlength="31"
				class={inputClass}
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm text-text-muted">
			Password
			<input
				type="password"
				name="password"
				required
				autocomplete="new-password"
				minlength="8"
				class={inputClass}
			/>
		</label>

		{#if form?.message}
			<p class="m-0 text-danger">{form.message}</p>
		{/if}

		<button
			type="submit"
			class="cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 font-[inherit] text-bg transition-opacity hover:opacity-90"
		>
			Sign up
		</button>
	</form>

	<p class="text-text-muted">
		Already have an account?
		<a href="/login?next={data.next}" class="text-accent no-underline hover:text-text">Log in</a>
	</p>
</div>
