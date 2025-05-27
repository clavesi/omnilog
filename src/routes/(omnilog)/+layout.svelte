<script lang="ts">
	import { Film, Tv, Book, Gamepad2, Music, Headphones, Plus, Search } from '@lucide/svelte';

	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	const { data, children } = $props();
</script>

<header
	class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur"
>
	<div class="container mx-auto px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-6">
				<Button href="/" class="text-primary bg-transparent text-2xl font-bold hover:bg-transparent"
					>Omnilog</Button
				>
				<nav class="hidden items-center space-x-6 md:flex">
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Film class="h-4 w-4" />
						Movies
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Tv class="h-4 w-4" />
						TV Shows
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Book class="h-4 w-4" />
						Books
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Gamepad2 class="h-4 w-4" />
						Games
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Music class="h-4 w-4" />
						Music
					</Button>
					<Button variant="ghost" size="sm" class="flex items-center gap-2">
						<Headphones class="h-4 w-4" />
						Podcasts
					</Button>
				</nav>
			</div>
			<div class="flex items-center space-x-4">
				<div class="relative hidden sm:block">
					<Search
						class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
					/>
					<Input placeholder="Search movies, books, games..." class="w-64 pl-10" />
				</div>
				<Button size="sm" class="flex items-center gap-2">
					<Plus class="h-4 w-4" />
					Add Review
				</Button>
				{#if data}
					<Avatar class="h-8 w-8">
						<AvatarImage src={data.user.image} />
						<AvatarFallback>{data.user.name}</AvatarFallback>
					</Avatar>
				{:else}
					<Button href="/sign-in">Sign In</Button>
				{/if}
			</div>
		</div>
	</div>
</header>

{@render children()}
