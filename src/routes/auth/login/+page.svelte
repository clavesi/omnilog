<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Icons } from "$lib/components/icons";
</script>

<div class="flex h-[calc(100vh-81px)] w-full items-center justify-center">
	<Card.Root class="w-full max-w-sm border rounded-lg shadow-sm bg-card text-card-foreground">
		<Card.Header>
			<Card.Title class="text-2xl">Login</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col justify-between w-full gap-2">
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
					<span class="px-2 bg-card text-muted-foreground"> Or continue with </span>
				</div>
			</div>

			<Button href="/auth/login/github">
				<Icons.github class="w-4 h-4 mr-2" />
				Github
			</Button>
			<Button disabled class="hover:cursor-not-allowed">
				<Icons.google class="w-4 h-4 mr-2" />
				Google
			</Button>
		</Card.Content>
	</Card.Root>
</div>
