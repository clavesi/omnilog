<script lang="ts">
import { enhance } from "$app/forms";
import type { ActionData, PageData } from "./$types";

let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<svelte:head>
	<title>Log in · Omnilog</title>
</svelte:head>

<div class="mx-auto my-16 max-w-[400px] px-4">
	<h1>Welcome back</h1>

	<form method="post" use:enhance class="mt-6 flex flex-col gap-4">
		<input type="hidden" name="next" value={data.next} />

		<label class="flex flex-col gap-1 text-sm">
			Email
			<input
				type="email"
				name="email"
				value={form?.email ?? ""}
				required
				autocomplete="email"
				class="rounded border border-gray-300 p-2 text-base"
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm">
			Password
			<input
				type="password"
				name="password"
				required
				autocomplete="current-password"
				class="rounded border border-gray-300 p-2 text-base"
			/>
		</label>

		{#if form?.message}
			<p class="m-0 text-[#b00020]">{form.message}</p>
		{/if}

		<button type="submit" class="cursor-pointer p-2.5 text-base">Log in</button>
	</form>

	<p>Don't have an account? <a href="/signup?next={data.next}">Sign up</a></p>
</div>
