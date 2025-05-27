<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { authClient } from '$lib/auth-client';

	const { data } = $props();
</script>

<div class="flex h-[calc(100vh-60px)] flex-col items-center justify-center gap-2">
	{#if data}
		<div class="flex flex-col items-center justify-center gap-2">
			<h1>Welcome back, <b>{data.user.name}</b>!</h1>
			<img src={data.user.image} alt="User Avatar" class="h-16 w-16 rounded-full" />
			<Button
				class="cursor-pointer rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
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
				Logout
			</Button>
		</div>
	{:else}
		<h1>Welcome to <b>omnilog</b>!</h1>
	{/if}
</div>
