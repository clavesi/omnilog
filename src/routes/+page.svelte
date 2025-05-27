<script lang="ts">
	import { authClient } from '$lib/auth-client';
	const session = authClient.useSession();
</script>

<div class="flex h-screen flex-col items-center justify-center gap-2">
	{#if $session.data}
		<div>
			<h1>Welcome back, {$session.data.user.name}!</h1>
			<button
				class="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
				on:click={() => authClient.signOut()}
			>
				Logout
			</button>
		</div>
	{:else}
		<button
			class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			on:click={() =>
				authClient.signIn.social({
					provider: 'github',
					callbackURL: '/'
				})}
		>
			Sign In with GitHub
		</button>
	{/if}
</div>
