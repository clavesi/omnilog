<script lang="ts">
import { Search } from "@lucide/svelte";
import { Tooltip } from "bits-ui";
import type { Snippet } from "svelte";
import { page } from "$app/state";
import type { LayoutData } from "./$types";

let { data, children }: { data: LayoutData; children: Snippet } = $props();

const path = $derived(page.url.pathname);
const onFeed = $derived(path === "/feed" || path.startsWith("/feed/"));
const onBrowse = $derived(path === "/browse" || path.startsWith("/browse/"));
const onSearch = $derived(path === "/search" || path.startsWith("/search/"));
const onProfile = $derived(
	data.user != null && (path === `/u/${data.user.username}` || path.startsWith(`/u/${data.user.username}/`)),
);

const navLink =
	"relative text-text-muted no-underline transition-colors hover:text-text after:absolute after:right-0 after:bottom-[-2px] after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 after:ease-out";
const navLinkActive = "text-text after:scale-x-100";
</script>

<Tooltip.Provider delayDuration={400}>
<header class="border-b border-border/80 bg-bg">
	<div class="mx-auto flex max-w-225 items-center justify-between px-6 py-4">
		<div class="flex items-center gap-4">
			<a
				href="/feed"
				class="font-display text-xl font-semibold tracking-tight text-accent no-underline transition-colors hover:text-text"
			>
				Omnilog
			</a>
			{#if data.user?.role === "admin" || data.user?.role === "owner"}
				<a
					href="/admin"
					class="rounded-full border border-danger px-3 py-1 font-mono text-xs no-underline transition-colors hover:bg-danger hover:text-bg {path.startsWith(
						'/admin',
					)
						? 'bg-danger text-bg'
						: 'text-danger'}"
				>
					Admin
				</a>
			{/if}
		</div>
		<nav class="flex items-center gap-5 text-sm">
			<Tooltip.Root>
				<Tooltip.Trigger class="contents">
					<a
						href="/search"
						class="{navLink} {onSearch ? navLinkActive : ''}"
						aria-label="Search"
						aria-current={onSearch ? "page" : undefined}
					>
						<Search size={20} aria-hidden="true" />
					</a>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						class="z-50 rounded-sm bg-surface px-2 py-1 text-xs text-text shadow-md"
						sideOffset={6}
					>
						Search
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
			<a
				href="/browse"
				class="{navLink} {onBrowse ? navLinkActive : ''}"
				aria-current={onBrowse ? "page" : undefined}
			>
				Browse
			</a>
			<a
				href="/feed"
				class="{navLink} {onFeed ? navLinkActive : ''}"
				aria-current={onFeed ? "page" : undefined}
			>
				Feed
			</a>
			{#if data.user}
				<a
					href="/u/{data.user.username}"
					class="{navLink} {onProfile ? navLinkActive : ''}"
					aria-current={onProfile ? "page" : undefined}
				>
					{data.user.username}
				</a>
				<a href="/settings" class="{navLink} {path.startsWith('/settings') ? navLinkActive : ''}">
					Settings
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
				<a href="/login" class="{navLink}">
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

<main class="mx-auto max-w-200 px-6 py-10">
	{@render children()}
</main>
</Tooltip.Provider>
