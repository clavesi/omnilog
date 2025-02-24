<script lang="ts">
	import { authClient } from '$lib/auth-client';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { GithubIcon } from 'lucide-svelte';
</script>

<div class="flex h-[80vh] items-center justify-center">
	<Card.Root class="w-[350px]">
		<Card.Header>
			<Card.Title tag="h1">Sign In</Card.Title>
			<Card.Description>Sign in using one of the following methods</Card.Description>
			<hr class="border-t border-gray-200 " />
		</Card.Header>
		<Card.Content>
			<Button
				class="w-full hover:cursor-pointer"
				variant="outline"
				onclick={async () => {
					await authClient.signIn.social({
						provider: 'github',
						callbackURL: '/'
					});
				}}><GithubIcon />Sign in with GitHub</Button
			>
		</Card.Content>
		<!-- <Card.Footer clas
         s="flex justify-between">
			<Button variant="outline">Cancel</Button>
			<Button>Deploy</Button>
		</Card.Footer> -->
	</Card.Root>
</div>
