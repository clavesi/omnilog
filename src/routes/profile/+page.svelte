<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';
	import { GithubIcon, LogOut } from 'lucide-svelte';

	let { data } = $props();
</script>

<main class="flex h-[80vh] flex-col items-center justify-center gap-4">
	{#if data.user}
		<h1 class="border-b-2 text-4xl font-bold">Profile</h1>
		<div class="flex flex-col items-center justify-center">
			<img class="h-32 w-32 rounded-full" src={data.user.image} alt="User" />
			<p class="mt-2 text-xl">{data.user.name}</p>
		</div>
		<Button
			class="hover:cursor-pointer"
			variant="outline"
			size="lg"
			onclick={async () => {
				await authClient.signOut();
				// Page needs to be reloaded to reflect the changes
				location.reload();
			}}><LogOut />Sign out</Button
		>
	{:else}
		<p>You are not logged in.</p>
	{/if}
</main>
