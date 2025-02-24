<script lang="ts">
	import '../app.css';
	import '@fontsource/roboto';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { UserIcon, LogOutIcon } from 'lucide-svelte';

	import { authClient } from '$lib/auth-client';

	let { children, data } = $props();
	let { session } = data;
</script>

<header class="text-white bg-neutral-900">
	<nav class="flex flex-wrap items-center justify-between h-20 max-w-screen-xl mx-auto">
		<div class="flex items-center justify-between">
			<a href="/">
				<!-- TODO: Get a logo -->
				<img
					class="w-16 h-16 mr-4"
					src="https://static.vecteezy.com/system/resources/previews/016/916/479/original/placeholder-icon-design-free-vector.jpg"
					alt="Placeholder Logo"
				/>
			</a>
			<div class="flex items-center justify-between gap-4 font-black uppercase">
				<a href="/" class="hover:text-stone-300">Movies</a>
				<a href="/" class="hover:text-stone-300">Shows</a>
				<a href="/" class="hover:text-stone-300">Anime</a>
				<a href="/" class="hover:text-stone-300">Manga</a>
				<a href="/" class="hover:text-stone-300">Books</a>
				<a href="/" class="hover:text-stone-300">Music</a>
			</div>
		</div>
		<div class="w-full md:block md:w-auto">
			{#if session}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							class="flex items-center justify-center hover:cursor-pointer hover:brightness-75"
						>
							<img class="w-12 h-12 rounded-full" src={session.user.image} alt="User" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Label>My Account</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								<a href="/profile" class="flex flex-row items-center justify-start w-full h-full">
									<UserIcon class="w-4 h-4 mr-2" />
									<span>Profile</span>
								</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<a
									href="#"
									class="flex flex-row items-center justify-start w-full h-full"
									onclick={async () => {
										await authClient.signOut();
										// Page needs to be reloaded to reflect the changes
										location.reload();
									}}
								>
									<LogOutIcon class="w-4 h-4 mr-2" />
									<span>Sign Out</span>
								</a>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<a href="/login" class="hover:text-stone-300">Login</a>
			{/if}
		</div>
	</nav>
</header>
{@render children()}

<style>
	:global(body) {
		font-family: 'Roboto', cursive;
	}
</style>
