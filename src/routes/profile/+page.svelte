<script lang="ts">
	import AvatarImage from "$lib/components/ui/avatar/avatar-image.svelte";
	import Avatar from "$lib/components/ui/avatar/avatar.svelte";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

	export let data;
</script>

<div class="flex h-[calc(100vh-81px)] w-full items-center justify-center">
	<Card>
		<CardHeader>
			<CardTitle>Profile</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col items-center justify-center gap-4 ">
			<div class="flex flex-col items-center justify-center gap-2">
				<Avatar class="size-24">
					<AvatarImage src={data.imageUrl} alt={data.username} />
				</Avatar>
				<p>@{data.displayName}</p>
			</div>
			<div class="flex flex-col items-center justify-center">
				<p>{data.username}</p>
				<p>{data.email}</p>
			</div>
		</CardContent>
	</Card>
</div>
