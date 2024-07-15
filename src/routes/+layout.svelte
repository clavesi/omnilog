<script lang="ts">
	import { ModeWatcher, toggleMode } from "mode-watcher";
	import "@fontsource/source-sans-pro/900.css";
	import "@fontsource-variable/open-sans/wdth-italic.css";
	import "../app.css";
	import { Sun, Moon, LogOut, User } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator
	} from "$lib/components/ui/dropdown-menu";
	import { Avatar, AvatarImage, AvatarFallback } from "$lib/components/ui/avatar";

	export let data;
</script>

<nav>
	<div class="mb-2 flex items-center justify-between border-b p-4 text-xl">
		<a href="/" class="fontTitle text-4xl text-mauve">omnilog</a>
		<div class="flex items-center gap-4">
			<Button on:click={toggleMode} variant="outline" size="icon">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
			{#if data.username}
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Avatar class="h-12 w-12">
							<AvatarImage src={data.imageUrl} alt={data.username} />
							<AvatarFallback>{data.username.charAt(0)}</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem href="/profile">
							<User class="mr-2 h-5 w-5" />
							<span>Profile</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem href="/auth/logout">
							<LogOut class="mr-2 h-5 w-5" />
							<span>Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			{:else}
				<Button href="/auth/login" class="rounded-md">Login</Button>
			{/if}
		</div>
	</div>
</nav>

<ModeWatcher />
<slot></slot>
