<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';

	let { data } = $props();
</script>

<main class="flex h-[80vh] items-center justify-center">
	{#if data.user}
		<p>Welcome, {data.user.name}!</p>
		<Button
			variant="outline"
			size="lg"
			onclick={async () => {
				await authClient.signOut();
			}}>Sign out</Button
		>
	{:else}
		<Button
			variant="outline"
			size="lg"
			onclick={async () => {
				await authClient.signIn.social({
					provider: 'github',
					callbackURL: '/'
				});
			}}>Sign in with GitHub</Button
		>
	{/if}
</main>
