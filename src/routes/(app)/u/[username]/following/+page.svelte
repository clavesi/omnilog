<script lang="ts">
import UserList from "$lib/components/UserList.svelte";

let { data } = $props();
</script>

<div>
	<header class="mb-8">
		<p class="m-0 mb-1 text-sm text-text-muted">
			<a href="/u/{data.profileUser.username}" class="link-soft">
				{data.profileUser.username}
			</a>
		</p>
		<h1 class="m-0 font-display text-3xl tracking-tight sm:text-4xl">Following</h1>
		<p class="mt-2 font-mono text-sm text-text-muted">
			{data.following.length}
			{data.following.length === 1 ? "person" : "people"}
		</p>
	</header>

	<UserList users={data.following} emptyMessage="Not following anyone yet." />
</div>
