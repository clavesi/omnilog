<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Icons } from "$lib/components/icons";
</script>

<div class="flex h-[calc(100vh-72px)] w-full items-center justify-center">
	<Card.Root class="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Login</Card.Title>
		</Card.Header>
		<Card.Content class="flex w-full flex-col justify-between gap-2">
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" placeholder="example@example.com" />
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input id="password" type="password" />
			</div>
			<Button disabled class="w-full">Sign In</Button>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t" />
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-card px-2 text-muted-foreground"> Or continue with </span>
				</div>
			</div>

			<Button href="/auth/login/github">
				<Icons.github class="mr-2 h-4 w-4" />
				Github
			</Button>
			<Button disabled class="hover:cursor-not-allowed">
				<Icons.google class="mr-2 h-4 w-4" />
				Google
			</Button>
			<!-- <div class="relative">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t" />
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="px-2 bg-card text-muted-foreground"> Or continue with </span>
				</div>
			</div> -->
		</Card.Content>
	</Card.Root>
</div>
