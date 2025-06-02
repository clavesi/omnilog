<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Camera, User, Bell, Shield, Palette, Globe } from '@lucide/svelte';

	// State for active tab
	let activeTab = $state('profile');

	const { data } = $props();
	// Form state
	let username = $state(data.user.name);
	let email = $state(data.user.email);
	let bio = $state(data.user.name);

	// Notification settings
	let emailNotifications = $state(true);
	let pushNotifications = $state(false);
	let reviewNotifications = $state(true);

	// Privacy settings
	let profilePublic = $state(true);
	let showActivity = $state(true);

	// Handle form submission
	function handleSubmit(event: Event) {
		event.preventDefault();
		// In a real app, this would call an API to update the user profile
		console.log('Saving profile changes:', { username, email, bio });
		// Show success message or handle errors
	}

	// Tab navigation
	function setActiveTab(tab: string) {
		activeTab = tab;
	}
</script>

<svelte:head>
	<title>Settings | omnilog</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="flex flex-col gap-8">
		<div>
			<h1 class="text-3xl font-bold">Settings</h1>
			<p class="text-muted-foreground mt-1">Manage your account settings and preferences</p>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
			<!-- Sidebar Navigation -->
			<div class="space-y-1">
				<nav class="flex flex-col space-y-1">
					<Button
						onclick={() => setActiveTab('profile')}
						variant="ghost"
						class="flex w-full cursor-pointer items-center justify-start rounded-md px-3 py-2 text-sm transition-colors {activeTab ===
						'profile'
							? 'bg-accent text-accent-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'}"
					>
						<User class=" h-4 w-4" />
						Profile
					</Button>
					<Button
						onclick={() => setActiveTab('account')}
						variant="ghost"
						class="flex w-full cursor-pointer items-center justify-start rounded-md px-3 py-2 text-sm transition-colors {activeTab ===
						'account'
							? 'bg-accent text-accent-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'}"
					>
						<Shield class="h-4 w-4" />
						Account
					</Button>
					<Button
						onclick={() => setActiveTab('appearance')}
						variant="ghost"
						class="flex w-full cursor-pointer items-center justify-start rounded-md px-3 py-2 text-sm transition-colors {activeTab ===
						'appearance'
							? 'bg-accent text-accent-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'}"
					>
						<Palette class="h-4 w-4" />
						Appearance
					</Button>
					<Button
						onclick={() => setActiveTab('notifications')}
						variant="ghost"
						class="flex w-full cursor-pointer items-center justify-start rounded-md px-3 py-2 text-sm transition-colors {activeTab ===
						'notifications'
							? 'bg-accent text-accent-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'}"
					>
						<Bell class="h-4 w-4" />
						Notifications
					</Button>
					<Button
						onclick={() => setActiveTab('privacy')}
						variant="ghost"
						class="flex w-full cursor-pointer items-center justify-start rounded-md px-3 py-2 text-sm transition-colors {activeTab ===
						'privacy'
							? 'bg-accent text-accent-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'}"
					>
						<Globe class="h-4 w-4" />
						Privacy
					</Button>
				</nav>
			</div>

			<!-- Content Area -->
			<div class="space-y-6">
				{#if activeTab === 'profile'}
					<!-- Profile Settings -->
					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
							<CardDescription>
								This information will be displayed publicly so be careful what you share.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onsubmit={handleSubmit} class="space-y-6">
								<!-- Avatar -->
								<div class="flex flex-col gap-2">
									<Label for="avatar">Profile Picture</Label>
									<div class="flex items-center gap-4">
										<Avatar class="h-24 w-24">
											<AvatarImage
												src={data.user.image || '/placeholder.svg'}
												alt={data.user.name}
											/>
											<AvatarFallback>{data.user.name[0]}</AvatarFallback>
										</Avatar>
										<div class="flex flex-col gap-2">
											<Button variant="outline" type="button" class="flex items-center gap-2">
												<Camera class="h-4 w-4" />
												Change Picture
											</Button>
											<p class="text-muted-foreground text-xs">JPG, GIF or PNG. Max size 2MB.</p>
										</div>
									</div>
								</div>

								<!-- Username -->
								<div class="flex flex-col gap-2">
									<Label for="username">Username</Label>
									<Input id="username" bind:value={username} />
									<p class="text-muted-foreground text-xs">
										This is your public display name. It can be your real name or a pseudonym.
									</p>
								</div>

								<!-- Email -->
								<div class="flex flex-col gap-2">
									<Label for="email">Email</Label>
									<Input id="email" type="email" bind:value={email} />
								</div>

								<!-- Bio -->
								<div class="flex flex-col gap-2">
									<Label for="bio">Bio</Label>
									<Textarea id="bio" bind:value={bio} rows={4} />
									<p class="text-muted-foreground text-xs">
										Write a short bio about yourself. This will be displayed on your profile.
									</p>
								</div>

								<div class="flex justify-end">
									<Button type="submit">Save Changes</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				{/if}

				{#if activeTab === 'account'}
					<!-- Account Settings -->
					<Card>
						<CardHeader>
							<CardTitle>Account</CardTitle>
							<CardDescription>
								Manage your account settings and security preferences.
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<div class="space-y-4">
								<div>
									<h4 class="text-sm font-medium">Password</h4>
									<p class="text-muted-foreground mb-3 text-sm">
										Change your password to keep your account secure.
									</p>
									<Button variant="outline">Change Password</Button>
								</div>

								<div>
									<h4 class="text-sm font-medium">Two-Factor Authentication</h4>
									<p class="text-muted-foreground mb-3 text-sm">
										Add an extra layer of security to your account.
									</p>
									<Button variant="outline">Enable 2FA</Button>
								</div>

								<div>
									<h4 class="text-sm font-medium">Delete Account</h4>
									<p class="text-muted-foreground mb-3 text-sm">
										Permanently delete your account and all associated data.
									</p>
									<Button variant="destructive">Delete Account</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				{#if activeTab === 'appearance'}
					<!-- Appearance Settings -->
					<Card>
						<CardHeader>
							<CardTitle>Appearance</CardTitle>
							<CardDescription>Customize the look and feel of the application.</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<div class="space-y-4">
								<div>
									<h4 class="text-sm font-medium">Theme</h4>
									<p class="text-muted-foreground mb-3 text-sm">Choose your preferred theme.</p>
									<div class="grid grid-cols-3 gap-3">
										<Button variant="outline" class="justify-start">Light</Button>
										<Button variant="outline" class="justify-start">Dark</Button>
										<Button variant="outline" class="justify-start">System</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				{#if activeTab === 'notifications'}
					<!-- Notification Settings -->
					<Card>
						<CardHeader>
							<CardTitle>Notifications</CardTitle>
							<CardDescription>Configure how you receive notifications.</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="text-sm font-medium">Email Notifications</h4>
										<p class="text-muted-foreground text-sm">Receive notifications via email</p>
									</div>
									<Switch bind:checked={emailNotifications} />
								</div>

								<div class="flex items-center justify-between">
									<div>
										<h4 class="text-sm font-medium">Push Notifications</h4>
										<p class="text-muted-foreground text-sm">
											Receive push notifications in your browser
										</p>
									</div>
									<Switch bind:checked={pushNotifications} />
								</div>

								<div class="flex items-center justify-between">
									<div>
										<h4 class="text-sm font-medium">Review Notifications</h4>
										<p class="text-muted-foreground text-sm">
											Get notified when someone reviews your content
										</p>
									</div>
									<Switch bind:checked={reviewNotifications} />
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}

				{#if activeTab === 'privacy'}
					<!-- Privacy Settings -->
					<Card>
						<CardHeader>
							<CardTitle>Privacy</CardTitle>
							<CardDescription>Manage your privacy settings and data visibility.</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="text-sm font-medium">Public Profile</h4>
										<p class="text-muted-foreground text-sm">
											Make your profile visible to other users
										</p>
									</div>
									<Switch bind:checked={profilePublic} />
								</div>

								<div class="flex items-center justify-between">
									<div>
										<h4 class="text-sm font-medium">Show Activity</h4>
										<p class="text-muted-foreground text-sm">
											Display your recent activity on your profile
										</p>
									</div>
									<Switch bind:checked={showActivity} />
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	</div>
</div>
