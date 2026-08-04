<script lang="ts">
type User = {
	id: string;
	username: string;
	image: string | null;
};

type Props = {
	users: User[];
	emptyMessage: string;
};

let { users, emptyMessage }: Props = $props();
</script>

{#if users.length === 0}
	<p class="py-12 text-center text-text-muted">{emptyMessage}</p>
{:else}
	<ul class="m-0 list-none p-0">
		{#each users as u (u.id)}
			<li class="border-b border-border/60">
				<a
					href="/u/{u.username}"
					class="group flex items-center gap-3 px-2 py-3 no-underline"
				>
					{#if u.image}
						<img src={u.image} alt="" class="h-9 w-9 shrink-0 rounded-full object-cover" />
					{:else}
						<span
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-text-muted"
						>
							{u.username.charAt(0).toUpperCase()}
						</span>
					{/if}
					<span class="text-sm text-text transition-colors group-hover:text-accent">
						{u.username}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
