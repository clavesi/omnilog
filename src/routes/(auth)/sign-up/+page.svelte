<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Github, Film, ArrowLeft } from '@lucide/svelte';
	import { siGoogle } from 'simple-icons';
	import { authClient } from '$lib/auth-client';
</script>

<svelte:head>
	<title>Sign Up | omnilog</title>
	<meta name="description" content="Create your omnilog account" />
</svelte:head>

<div class="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-8">
	<div class="w-full max-w-md space-y-6">
		<!-- Logo and branding -->
		<div class="flex flex-col items-center space-y-2 text-center">
			<div class="bg-primary flex h-12 w-12 items-center justify-center rounded-full">
				<Film class="text-primary-foreground h-6 w-6" />
			</div>
			<h1 class="text-primary text-2xl font-bold">omnilog</h1>
			<p class="text-muted-foreground">Create your account to track, rate, and discover media</p>
		</div>

		<!-- Sign In Card -->
		<Card.Root class="w-full shadow-md">
			<Card.Header class="space-y-1">
				<Card.Title class="text-center text-xl">Sign up</Card.Title>
				<Card.Description class="text-center">
					Join the community to track, rate, and discover media.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Username Input -->
				<div class="space-y-2">
					<Label for="email">Username</Label>
					<Input type="email" id="email" placeholder="example" disabled></Input>
				</div>

				<!-- Email Input -->
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input type="email" id="email" placeholder="name@example.com" disabled></Input>
				</div>

				<!-- Password Input -->
				<div class="space-y-2">
					<div class="flex items-center">
						<Label for="password">Password</Label>
					</div>
					<Input id="password" type="password" disabled />
				</div>

				<!--  Sign Up Button -->
				<Button class="w-full cursor-pointer" type="submit">Sign Up</Button>

				<!-- OAuth Separator -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<Separator class="w-full" />
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-card text-muted-foreground px-2">Or continue with</span>
					</div>
				</div>

				<!-- OAuth Options -->
				<div class="grid grid-cols-2 gap-4">
					<Button
						class="w-full cursor-pointer"
						type="button"
						onclick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/' })}
					>
						<Github class="h-5 w-5" />
						Sign up with GitHub
					</Button>
					<Button
						class="w-full cursor-pointer"
						type="button"
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
						Sign up with Google
					</Button>
				</div>
			</Card.Content>
			<Card.Footer class="flex flex-col space-y-4">
				<div class="text-center text-sm">
					Already have an account?{' '}
					<a href="sign-in" class="text-primary font-medium underline">Sign In</a>
				</div>
				<div class="text-center text-sm">
					<a
						href="/"
						class="text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
					>
						<ArrowLeft class="h-4 w-4" />
						Back to home
					</a>
				</div>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
