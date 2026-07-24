<script lang="ts">
import { enhance } from "$app/forms";
import LogCard from "$lib/components/LogCard.svelte";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import { getMediaTypeColor, mediaTypeLabel } from "$lib/media-type-colors";
import { isMetadataType } from "$lib/media-types";

let { data } = $props();

const item = $derived(data.item);
const metadata = $derived(data.metadata);
const genres = $derived(data.genres);
const year = $derived(item.releaseDate ? item.releaseDate.slice(0, 4) : null);
const averageRatingNum = $derived(item.averageRating != null ? Number.parseFloat(item.averageRating) : NaN);
const typeColor = $derived(getMediaTypeColor(item.mediaType));

let deletedLogIds = $state(new Set<string>());
const visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

let showListPicker = $state(false);
// svelte-ignore state_referenced_locally -- intentional; the $effect below
// resyncs on every data change, this is just the initial value.
let userLists = $state(data.userLists);
let showNewListInput = $state(false);
let newListTitle = $state("");
let creatingList = $state(false);

$effect(() => {
	userLists = data.userLists;
});

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}
</script>

<article>
	{#if item.backdropImageUrl}
		<div class="relative -mx-6 mb-8 h-56 overflow-hidden sm:mx-0 sm:rounded-md">
			<div
				class="absolute inset-0 bg-cover bg-center"
				style="background-image: url({item.backdropImageUrl})"
			></div>
			<div
				class="absolute inset-0 bg-linear-to-b from-bg/20 via-bg/40 to-bg"
				aria-hidden="true"
			></div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-8 sm:grid-cols-[180px_1fr]">
		<div
			class="group/cover flex gap-2 sm:flex-col"
			style="--type-color: {typeColor}"
		>
			<MediaTypeMark mediaType={item.mediaType} variant="tab" />
			{#if item.coverImageUrl}
				<img
					class="cover-hover w-full max-w-45 rounded-sm group-hover/cover:shadow-[0_0_0_1px_var(--type-color)]"
					src={item.coverImageUrl}
					alt=""
				/>
			{/if}
		</div>

		<div>
			<h1 class="mb-2 text-3xl leading-tight">
				{item.title}
				{#if year}
					<span class="font-mono text-xl font-normal text-text-muted">({year})</span>
				{/if}
			</h1>

			{#if metadata && isMetadataType(metadata, "movie") && metadata.tagline}
				<p class="mb-4 text-text-muted italic">{metadata.tagline}</p>
			{/if}

			<ul class="m-0 mb-4 flex list-none flex-wrap items-center gap-x-4 gap-y-2 p-0 text-sm">
				<li
					class="flex items-center gap-1.5 rounded-sm border border-border px-2 py-0.5 font-mono text-text-muted"
				>
					<MediaTypeMark mediaType={item.mediaType} variant="dot" />
					{mediaTypeLabel(item.mediaType)}
				</li>

				{#if metadata && isMetadataType(metadata, "movie") && metadata.runtime}
					<li class="font-mono text-text-muted">{metadata.runtime} min</li>
				{/if}

				{#if metadata && isMetadataType(metadata, "tv")}
					{#if metadata.number_of_seasons}
						<li class="font-mono text-text-muted">
							{metadata.number_of_seasons} season{metadata.number_of_seasons === 1 ? "" : "s"}
						</li>
					{/if}
					{#if metadata.number_of_episodes}
						<li class="font-mono text-text-muted">
							{metadata.number_of_episodes} episode{metadata.number_of_episodes === 1 ? "" : "s"}
						</li>
					{/if}
					{#if metadata.status}
						<li class="font-mono text-text-muted">{metadata.status}</li>
					{/if}
				{/if}

				{#if metadata && isMetadataType(metadata, "game")}
					{#if metadata.platforms.length}
						<li class="text-text-muted">{metadata.platforms.join(", ")}</li>
					{/if}
					{#if metadata.developers.length}
						<li class="text-text-muted">Dev: {metadata.developers.join(", ")}</li>
					{/if}
					{#if metadata.publishers.length && metadata.publishers.join() !== metadata.developers.join()}
						<li class="text-text-muted">Pub: {metadata.publishers.join(", ")}</li>
					{/if}
					{#if metadata.game_modes.length}
						<li class="text-text-muted">{metadata.game_modes.join(", ")}</li>
					{/if}
				{/if}

				{#if metadata && isMetadataType(metadata, "anime")}
					{#if metadata.episodes}
						<li class="font-mono text-text-muted">
							{metadata.episodes} episode{metadata.episodes === 1 ? "" : "s"}
						</li>
					{/if}
					{#if metadata.duration_minutes}
						<li class="font-mono text-text-muted">{metadata.duration_minutes} min/ep</li>
					{/if}
					{#if metadata.studios.length}
						<li class="text-text-muted">{metadata.studios.join(", ")}</li>
					{/if}
					{#if metadata.status}
						<li class="font-mono text-text-muted">{metadata.status}</li>
					{/if}
				{/if}

				{#if metadata && isMetadataType(metadata, "manga")}
					{#if metadata.chapters}
						<li class="font-mono text-text-muted">
							{metadata.chapters} chapter{metadata.chapters === 1 ? "" : "s"}
						</li>
					{/if}
					{#if metadata.volumes}
						<li class="font-mono text-text-muted">
							{metadata.volumes} volume{metadata.volumes === 1 ? "" : "s"}
						</li>
					{/if}
					{#if metadata.authors.length}
						<li class="text-text-muted">{metadata.authors.join(", ")}</li>
					{/if}
					{#if metadata.status}
						<li class="font-mono text-text-muted">{metadata.status}</li>
					{/if}
				{/if}

				{#if metadata && isMetadataType(metadata, "music")}
					{#if metadata.artists.length}
						<li class="text-text-muted">{metadata.artists.join(", ")}</li>
					{/if}
					{#if metadata.album_type}
						<li class="font-mono text-text-muted capitalize">{metadata.album_type}</li>
					{/if}
					{#if metadata.label}
						<li class="text-text-muted">{metadata.label}</li>
					{/if}
					{#if metadata.track_count}
						<li class="font-mono text-text-muted">{metadata.track_count} tracks</li>
					{/if}
				{/if}

				{#if metadata && isMetadataType(metadata, "book")}
					{#if metadata.authors.length}
						<li class="text-text-muted">{metadata.authors.join(", ")}</li>
					{/if}
					{#if metadata.page_count}
						<li class="font-mono text-text-muted">{metadata.page_count} pages</li>
					{/if}
					{#if metadata.publisher}
						<li class="text-text-muted">{metadata.publisher}</li>
					{/if}
				{/if}

				{#if Number.isFinite(averageRatingNum)}
					<li class="font-mono text-text">
						<span class="text-accent">★</span>
						{(averageRatingNum / 2).toFixed(1)}
						<span class="text-text-muted">
							({item.ratingCount} rating{item.ratingCount === 1 ? "" : "s"})
						</span>
					</li>
				{/if}
			</ul>

			{#if genres.length}
				<ul class="m-0 mb-6 flex list-none flex-wrap gap-2 p-0">
					{#each genres as g (g.slug)}
						<li
							class="rounded-sm border border-border px-2.5 py-1 text-[0.8125rem] text-text-muted"
						>
							{g.name}
						</li>
					{/each}
				</ul>
			{/if}

			{#if item.description}
				<p class="mb-8 leading-relaxed text-text">{item.description}</p>
			{/if}

			<div class="flex flex-wrap items-center gap-3">
				<a
					href="/media/{item.slug}/log"
					class="inline-block cursor-pointer rounded-sm border-none bg-accent px-6 py-2.5 text-base text-bg no-underline transition-opacity hover:opacity-90"
				>
					Log this
				</a>

				{#if data.currentUserId}
					<form method="POST" action="?/toggleFavorite" use:enhance>
						<button
							type="submit"
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-4 py-2 transition-colors {data.isFavorite
								? 'border-accent text-accent'
								: 'border-border text-text hover:border-text-muted hover:bg-surface'}"
						>
							<span>{data.isFavorite ? "★" : "☆"}</span>
							{data.isFavorite ? `${mediaTypeLabel(item.mediaType)} favorite` : "Set as favorite"}
						</button>
					</form>

					<div class="relative">
						<button
							type="button"
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-text transition-colors hover:border-text-muted hover:bg-surface"
							onclick={() => (showListPicker = !showListPicker)}
						>
							+ Add to list
						</button>

						{#if showListPicker}
							<div
								class="absolute top-full left-0 z-10 mt-2 w-64 rounded-sm border border-border bg-bg p-3 shadow-lg"
							>
								{#if userLists.length === 0}
									<p class="m-0 mb-2 text-sm text-text-muted">No lists yet.</p>
								{:else}
									<ul class="m-0 mb-2 max-h-48 list-none overflow-y-auto p-0">
										{#each userLists as list (list.id)}
											<li>
												<form
													method="POST"
													action="?/toggleListItem"
													use:enhance={() => {
														return async ({ result, update }) => {
															await update({ reset: false });
															if (result.type === "success" && result.data?.userLists) {
																userLists = result.data.userLists as typeof userLists;
															}
														};
													}}
												>
													<input type="hidden" name="listId" value={list.id} />
													<input type="hidden" name="inList" value={String(list.inList)} />
													<button
														type="submit"
														class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-text hover:bg-surface"
													>
														<span class="w-4 shrink-0">{list.inList ? "✓" : ""}</span>
														{list.title}
													</button>
												</form>
											</li>
										{/each}
									</ul>
								{/if}

								{#if showNewListInput}
									<form
										method="POST"
										action="?/createListWithItem"
										use:enhance={() => {
											creatingList = true;
											return async ({ result, update }) => {
												await update({ reset: false });
												creatingList = false;
												if (result.type === "success" && result.data?.userLists) {
													userLists = result.data.userLists as typeof userLists;
													showNewListInput = false;
													newListTitle = "";
												}
											};
										}}
										class="flex gap-2 border-t border-border pt-2"
									>
										<input
											type="text"
											name="title"
											bind:value={newListTitle}
											placeholder="List name"
											required
											class="min-w-0 flex-1 rounded-sm border border-border bg-bg px-2 py-1 text-sm text-text"
										/>
										<button
											type="submit"
											disabled={creatingList}
											class="shrink-0 rounded-sm bg-accent px-2 py-1 text-sm text-bg disabled:opacity-60"
										>
											{creatingList ? "..." : "Add"}
										</button>
									</form>
								{:else}
									<button
										type="button"
										class="w-full border-t border-border pt-2 text-left text-sm text-accent hover:text-text"
										onclick={() => (showNewListInput = true)}
									>
										+ Create new list
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				{#if item.mediaType === "tv"}
					<a
						href="/media/{item.slug}/season/1"
						class="inline-block rounded-sm border border-border px-4 py-2 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
					>
						Browse episodes
					</a>
				{:else if item.mediaType === "anime"}
					<a
						href="/media/{item.slug}/episodes"
						class="inline-block rounded-sm border border-border px-4 py-2 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
					>
						Browse episodes
					</a>
				{:else if item.mediaType === "manga"}
					<a
						href="/media/{item.slug}/chapters"
						class="inline-block rounded-sm border border-border px-4 py-2 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
					>
						Browse chapters
					</a>
				{:else if item.mediaType === "music"}
					<a
						href="/media/{item.slug}/tracks"
						class="inline-block rounded-sm border border-border px-4 py-2 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
					>
						Browse tracks
					</a>
				{/if}
			</div>

			{#if metadata && isMetadataType(metadata, "tv") && metadata.number_of_seasons}
				<div class="mt-4 flex flex-wrap gap-2">
					{#each Array(metadata.number_of_seasons) as _, i}
						<a
							href="/media/{item.slug}/season/{i + 1}"
							class="rounded-sm border border-border px-3 py-1 font-mono text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
						>
							S{i + 1}
						</a>
					{/each}
				</div>
			{/if}

			<section class="mt-12 border-t border-border pt-8">
				<h2 class="mb-6 text-xl">Logs & Reviews</h2>
				{#if visibleLogs.length === 0}
					<p class="text-text-muted">No one has logged this yet. Be the first!</p>
				{:else}
					{#each visibleLogs as log (log.id)}
						<LogCard
							{log}
							showMediaInfo={false}
							showAuthor={true}
							isOwner={data.currentUserId === log.userId}
							onDelete={handleDeleted}
						/>
					{/each}
				{/if}
			</section>
		</div>
	</div>
</article>
