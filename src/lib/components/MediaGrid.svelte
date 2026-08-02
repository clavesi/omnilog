<script lang="ts">
import MediaTypeMark from "./MediaTypeMark.svelte";
import StaticStars from "./StaticStars.svelte";

type Item = {
	slug: string;
	title: string;
	mediaType: string;
	releaseDate: string | null;
	coverImageUrl: string | null;
	averageRating: string | null;
	ratingCount: number;
};

type Props = {
	items: Item[];
};

let { items }: Props = $props();
</script>

{#if items.length === 0}
	<p class="py-12 text-center text-text-muted">Nothing here yet.</p>
{:else}
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
		{#each items as item (item.slug)}
			<a
				href="/media/{item.slug}"
				class="group/cover flex flex-col gap-2 no-underline transition-transform"
			>
				{#if item.coverImageUrl}
					<img
						src={item.coverImageUrl}
						alt={item.title}
						class="cover-hover aspect-2/3 w-full rounded-sm object-cover"
						loading="lazy"
					/>
				{:else}
					<div
						class="flex aspect-2/3 w-full items-center justify-center rounded-sm bg-surface text-xs text-text-muted"
					>
						No cover
					</div>
				{/if}
				<div class="flex items-start gap-1.5">
					<MediaTypeMark mediaType={item.mediaType} />
					<div class="min-w-0 flex-1">
						<p class="m-0 truncate text-sm leading-tight text-text group-hover/cover:text-accent">
							{item.title}
						</p>
						<p class="m-0 mt-0.5 text-xs text-text-muted">
							{item.releaseDate ? item.releaseDate.slice(0, 4) : "—"}
						</p>
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
