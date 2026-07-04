<script lang="ts">
import { enhance } from "$app/forms";
import { igdbImage } from "$lib/igdb-image";
import type { IgdbSearchHit } from "$lib/server/igdb";
import type { TmdbSearchHit } from "$lib/server/tmdb";
import { tmdbImage } from "$lib/tmdb-image";

type SearchHit = TmdbSearchHit | IgdbSearchHit;

let query = $state("");
let results = $state<SearchHit[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let importing = $state<string | null>(null); // `${type}-${id}` of item being imported

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let abortController: AbortController | undefined;

function onInput() {
	clearTimeout(debounceTimer);
	error = null;
	abortController?.abort();

	if (query.trim().length < 2) {
		results = [];
		loading = false;
		return;
	}

	loading = true;
	debounceTimer = setTimeout(runSearch, 250);
}

async function runSearch() {
	const q = query.trim();
	if (q.length < 2) return;

	abortController = new AbortController();

	try {
		const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
			signal: abortController.signal,
		});
		const data = await res.json();
		results = data.results ?? [];
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") return;
		error = "Search failed";
		results = [];
	} finally {
		loading = false;
	}
}

function titleOf(hit: SearchHit): string {
	return hit.type === "movie" ? hit.title : hit.name;
}

function yearOf(hit: SearchHit): string {
	if (hit.type === "movie") return hit.release_date?.slice(0, 4) ?? "";
	if (hit.type === "tv") return hit.first_air_date?.slice(0, 4) ?? "";
	if (hit.type === "game") {
		return hit.firstReleaseDate ? new Date(hit.firstReleaseDate * 1000).getFullYear().toString() : "";
	}
	return "";
}

function typeLabel(hit: SearchHit): string {
	if (hit.type === "movie") return "Movie";
	if (hit.type === "tv") return "TV";
	return "Game";
}
</script>

<div class="mx-auto my-8 max-w-[640px] px-4">
	<input
		type="search"
		bind:value={query}
		oninput={onInput}
		placeholder="Search movies, TV shows, and games..."
		autocomplete="off"
		class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
	/>

	{#if loading}
		<p class="mt-4 text-gray-500">Searching...</p>
	{:else if error}
		<p class="mt-4 text-red-600">{error}</p>
	{:else if query.length >= 2 && results.length === 0}
		<p class="mt-4 text-gray-500">No results.</p>
	{/if}

	<ul class="m-0 mt-4 list-none p-0">
		{#each results as hit (`${hit.type}-${hit.id}`)}
			{@const itemKey = `${hit.type}-${hit.id}`}
			<li class="m-0">
				<form
					method="POST"
					action="?/pickResult"
					class="m-0"
					use:enhance={() => {
						importing = itemKey;
						return async ({ update }) => {
							importing = null;
							await update();
						};
					}}
				>
					<input type="hidden" name="type" value={hit.type} />
					<input type="hidden" name="externalId" value={hit.id} />
					<button
						type="submit"
						class="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent p-2 text-left font-[inherit] text-inherit hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60"
						disabled={importing === itemKey}
					>
						{#if hit.type === "game"}
							{#if hit.coverImageId}
								<img
									src={igdbImage(hit.coverImageId, "cover_small")}
									alt=""
									class="h-[69px] w-[46px] shrink-0 rounded object-cover"
								/>
							{:else}
								<div class="h-[69px] w-[46px] shrink-0 rounded bg-gray-200"></div>
							{/if}
						{:else if hit.poster_path}
							<img
								src={tmdbImage(hit.poster_path, "w185")}
								alt=""
								class="h-[69px] w-[46px] shrink-0 rounded object-cover"
							/>
						{:else}
							<div class="h-[69px] w-[46px] shrink-0 rounded bg-gray-200"></div>
						{/if}
						<div class="flex flex-1 flex-col">
							<span class="font-medium">{titleOf(hit)}</span>
							<span class="text-sm text-gray-500">
								{typeLabel(hit)}
								{#if yearOf(hit)}
									· {yearOf(hit)}{/if}
							</span>
						</div>
						{#if importing === itemKey}
							<span class="text-sm text-gray-500 italic">Importing...</span>
						{/if}
					</button>
				</form>
			</li>
		{/each}
	</ul>
</div>
