<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';
	import { GithubIcon, LogOut } from 'lucide-svelte';

	let { data } = $props();
</script>

<main class="flex h-[80vh] items-center justify-center">
	{#if data.user}
		<div class="flex flex-col items-center justify-center">
			<p>Welcome, {data.user.name}!</p>
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
		</div>
	{:else}
		<Button
			class="hover:cursor-pointer"
			variant="outline"
			size="lg"
			onclick={async () => {
				await authClient.signIn.social({
					provider: 'github',
					callbackURL: '/'
				});
			}}><GithubIcon />Sign in with GitHub</Button
		>
	{/if}
</main>
