<script lang="ts">
import type { Snippet } from "svelte";
import type { LayoutData } from "./$types";

let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<header class="flex items-center justify-between border-b border-gray-200 px-8 py-4">
	<a href="/feed" class="font-bold text-inherit no-underline">Omnilog</a>
	<nav class="flex items-center gap-4">
		<a
			href="/search"
			class="flex items-center text-inherit no-underline opacity-85 hover:opacity-100"
			aria-label="Search"
		>
			<svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2" />
				<path
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					d="M15.5 15.5 20 20"
				/>
			</svg>
		</a>
		<a href="/feed">Feed</a>
		{#if data.user}
			<a href="/u/{data.user.username}">{data.user.username}</a>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="cursor-pointer border-none bg-transparent p-0 font-inherit text-inherit"
				>
					Log out
				</button>
			</form>
		{:else}
			<a href="/login">Log in</a>
			<a href="/signup">Sign up</a>
		{/if}
	</nav>
</header>

<main class="mx-auto max-w-[800px] p-8">
	{@render children()}
</main>
