<script lang="ts">
	import { enhance } from "$app/forms";
	import { invalidate } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card, CardContent, CardHeader } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { onMount } from "svelte";

	export let data;
	const { userProfile } = data;

	console.log(userProfile);

	let email = "";
	let displayName = "";
	let username = "";

	onMount(() => {
		if (userProfile) {
			email = userProfile.email;
			displayName = userProfile.name;
			username = userProfile.username;
		}
	});
</script>

{#if userProfile}
	<Card>
		<CardHeader>Manage your profile</CardHeader>
		<CardContent>
			<form
				method="post"
				use:enhance={({ formData }) => {
					// Happens before submit
					formData.set("name", displayName);
					formData.set("username", username);
					formData.set("email", email);
					// Happens after submit
					return ({ result }) => {
						if (result.type === "success") {
							invalidate("/");
							alert("Updated!");
						} else {
							alert("Something went wrong!");
						}
					};
				}}
			>
				<div>
					<Label>Email</Label>
					<Input bind:value={email} />
				</div>
				<div>
					<Label>Display Name</Label>
					<Input bind:value={displayName} />
				</div>
				<div>
					<Label>Username</Label>
					<Input bind:value={username} />
				</div>
				<div>
					<Button type="submit">Update</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<Button href="/auth/logout">Logout</Button>
{:else}
	<Button href="/auth/login">Login to the site</Button>
{/if}
