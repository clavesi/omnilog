<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth-client';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		Film,
		Tv,
		Book,
		Gamepad2,
		Music,
		Headphones,
		Plus,
		Search,
		LogOut,
		User,
		Settings,
		Moon,
		Sun
	} from '@lucide/svelte';

	// ===== Theme state =====
	let isDarkMode = $state(false);
	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
		updateTheme();
	});
	function updateTheme() {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}
	function toggleTheme() {
		isDarkMode = !isDarkMode;
		updateTheme();
	}

	const { data, children } = $props();
</script>

<!-- Prevent flash of unstyled content -->
<svelte:head>
	<script>
		try {
			if (
				localStorage.getItem('theme') === 'dark' ||
				(!localStorage.getItem('theme') &&
					window.matchMedia('(prefers-color-scheme: dark)').matches)
			) {
				document.documentElement.classList.add('dark');
			}
		} catch (e) {}
	</script>
</svelte:head>

<header class="bg-background/95 sticky border-b">
	<div class=" mx-auto px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<Button
					href="/"
					class="text-primary bg-transparent text-2xl font-bold  hover:bg-transparent"
				>
					omnilog
				</Button>
				<nav class="hidden items-center space-x-2 md:flex">
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Film class="h-4 w-4" />
						<span class="hidden lg:flex">Movies</span>
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Tv class="h-4 w-4" />
						<span class="hidden lg:flex">TV</span>
						<!-- TV, Anime -->
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Book class="h-4 w-4" />
						<span class="hidden lg:flex">Books</span>
						<!-- Books, Comics, Manga -->
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Gamepad2 class="h-4 w-4" />
						<span class="hidden lg:flex">Games</span>
						<!-- Video Games, Board Games, Card Games -->
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Music class="h-4 w-4" />
						<span class="hidden lg:flex">Music</span>
						<!-- Albums, Songs, Artists -->
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Headphones class="h-4 w-4" />
						<span class="hidden lg:flex">Podcasts</span>
					</Button>
				</nav>
			</div>
			<div class="flex items-center space-x-4">
				<div>
					<div class="relative hidden md:block">
						<Search
							class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
						/>
						<Input placeholder="Search" class="w-48 pl-10" />
					</div>

					<div class="md:hidden">
						<Button size="sm" variant="outline" class="cursor-pointer">
							<Search class="h-4 w-4" />
						</Button>
					</div>
				</div>
				<Button size="sm" class="cursor-pointer items-center gap-2">
					<Plus class="h-4 w-4" />
					<span class="hidden md:flex">Add Review</span>
				</Button>
				{#if data.user}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Avatar class="h-8 w-8 cursor-pointer">
								<AvatarImage src={data.user.image} />
								<AvatarFallback>{data.user.name}</AvatarFallback>
							</Avatar>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<a href={`/profile`} class="flex h-full w-full items-center gap-2">
										<User />
										<span>Profile</span>
									</a>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<a href="/settings" class="flex h-full w-full items-center gap-2">
										<Settings />
										<span>Settings</span>
									</a>
								</DropdownMenu.Item>

								<DropdownMenu.Item>
									<div
										class="flex h-full w-full items-center gap-2"
										onclick={(e) => e.stopPropagation()}
										role="presentation"
									>
										{#if isDarkMode}
											<Moon class="mr-2 h-4 w-4" />
										{:else}
											<Sun class="mr-2 h-4 w-4" />
										{/if}
										<Switch
											checked={isDarkMode}
											onCheckedChange={toggleTheme}
											class="cursor-pointer"
										/>
									</div>
								</DropdownMenu.Item>
								<DropdownMenu.Separator />

								<DropdownMenu.Item>
									<button
										class="flex h-full w-full cursor-pointer items-center gap-2"
										onclick={async () => {
											await authClient.signOut({
												fetchOptions: {
													onSuccess: () => {
														window.location.reload();
													}
												}
											});
										}}
									>
										<LogOut />Logout
									</button>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Button href="/sign-in">Sign In</Button>
				{/if}
			</div>
		</div>
	</div>
</header>

{@render children()}
