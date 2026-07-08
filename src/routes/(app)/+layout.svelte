<script lang="ts">
import type { Snippet } from "svelte";
import type { LayoutData } from "./$types";

let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<header class="border-b border-border bg-bg">
	<div class="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
		<a
			href="/feed"
			class="font-display text-xl font-semibold tracking-tight text-text no-underline hover:text-accent"
		>
			Omnilog
		</a>
		<nav class="flex items-center gap-5 text-sm">
			<a
				href="/search"
				class="text-text-muted no-underline transition-colors hover:text-text"
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
			<a href="/feed" class="text-text-muted no-underline transition-colors hover:text-text">
				Feed
			</a>
			{#if data.user}
				<a
					href="/u/{data.user.username}"
					class="text-text-muted no-underline transition-colors hover:text-text"
				>
					{data.user.username}
				</a>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="cursor-pointer border-none bg-transparent p-0 font-inherit text-text-muted transition-colors hover:text-text"
					>
						Log out
					</button>
				</form>
			{:else}
				<a href="/login" class="text-text-muted no-underline transition-colors hover:text-text">
					Log in
				</a>
				<a
					href="/signup"
					class="text-accent no-underline transition-colors hover:text-text"
				>
					Sign up
				</a>
			{/if}
		</nav>
	</div>
</header>

<main class="mx-auto max-w-[800px] px-6 py-10">
	{@render children()}
</main>
