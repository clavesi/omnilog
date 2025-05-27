<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Github } from '@lucide/svelte';
	import { siGoogle } from 'simple-icons';

	import { authClient } from '$lib/auth-client';
	const session = authClient.useSession();
</script>

<div class="flex h-screen flex-col items-center justify-center gap-2">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>Sign In</Card.Title>
			<Card.Description>
				<p>Sign in to continue.</p>
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex flex-col items-center justify-center gap-2">
				<!-- TODO: Fully fledge this out -->
				<Input type="email" placeholder="email"></Input>
				<Input type="password" placeholder="password"></Input>
				<Button>Submit</Button>
				<div class="flex w-full items-center gap-2 py-2">
					<hr class="border-border flex-grow border-t" />
					<span class="text-muted-foreground text-xs">OR</span>
					<hr class="border-border flex-grow border-t" />
				</div>
				<Button
					class="w-full cursor-pointer"
					onclick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/' })}
				>
					<Github class="h-5 w-5" />
					Sign in with GitHub
				</Button>
				<Button
					class="w-full cursor-pointer bg-green-700/90"
					onclick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/' })}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-label="Google"
						class="h-5 w-5"
					>
						<title>Google</title>
						<path d={siGoogle.path} />
					</svg>
					Sign in with Google
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
