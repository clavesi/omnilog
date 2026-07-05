<script lang="ts">
import { enhance } from "$app/forms";
import { igdbImage, openLibraryImage, tmdbImage } from "$lib/media-images";
import type { IgdbSearchHit } from "$lib/server/igdb";
import type { JikanSearchHit } from "$lib/server/jikan";
import type { MusicBrainzSearchHit } from "$lib/server/musicbrainz";
import type { OpenLibrarySearchHit } from "$lib/server/openlibrary";
import type { TmdbSearchHit } from "$lib/server/tmdb";

type SearchHit = TmdbSearchHit | IgdbSearchHit | JikanSearchHit | MusicBrainzSearchHit | OpenLibrarySearchHit;
type SearchType = "all" | "movie" | "tv" | "game" | "anime" | "manga" | "music" | "book";
type DuplicateInfo = { slug: string; title: string; mediaType: string; coverImageUrl: string | null };

const TYPE_OPTIONS: { value: SearchType; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "movie", label: "Movies" },
	{ value: "tv", label: "TV" },
	{ value: "game", label: "Games" },
	{ value: "anime", label: "Anime" },
	{ value: "manga", label: "Manga" },
	{ value: "music", label: "Music" },
	{ value: "book", label: "Books" },
];

let query = $state("");
let selectedType = $state<SearchType>("all");
let results = $state<SearchHit[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let importing = $state<string | null>(null);
let duplicateWarnings = $state<Record<string, DuplicateInfo>>({});

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

function onTypeChange(type: SearchType) {
	selectedType = type;
	clearTimeout(debounceTimer);
	if (query.trim().length >= 2) {
		loading = true;
		runSearch();
	}
}

async function runSearch() {
	const q = query.trim();
	if (q.length < 2) return;

	abortController = new AbortController();

	try {
		const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${selectedType}`, {
			signal: abortController.signal,
		});
		const data = await res.json();
		results = data.results ?? [];
		duplicateWarnings = {};
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") return;
		error = "Search failed";
		results = [];
	} finally {
		loading = false;
	}
}

function titleOf(hit: SearchHit): string {
	if (hit.type === "movie") return hit.title;
	if (hit.type === "tv") return hit.name;
	if (hit.type === "game") return hit.name;
	return hit.title; // anime, manga, music, book
}

function subtitleOf(hit: SearchHit): string {
	if (hit.type === "music") return hit.artists.join(", ");
	if (hit.type === "book") return hit.authors.join(", ");
	return "";
}

function yearOf(hit: SearchHit): string {
	if (hit.type === "movie") return hit.release_date?.slice(0, 4) ?? "";
	if (hit.type === "tv") return hit.first_air_date?.slice(0, 4) ?? "";
	if (hit.type === "game") {
		return hit.firstReleaseDate ? new Date(hit.firstReleaseDate * 1000).getFullYear().toString() : "";
	}
	if (hit.type === "anime" || hit.type === "manga" || hit.type === "music" || hit.type === "book") {
		return hit.year ? String(hit.year) : "";
	}
	return "";
}

function typeLabel(hit: SearchHit): string {
	if (hit.type === "movie") return "Movie";
	if (hit.type === "tv") return "TV";
	if (hit.type === "game") return "Game";
	if (hit.type === "anime") return "Anime";
	if (hit.type === "manga") return "Manga";
	if (hit.type === "music") return hit.primaryType ?? "Music";
	return "Book";
}

function imageOf(hit: SearchHit): string | null {
	if (hit.type === "game") return igdbImage(hit.coverImageId, "cover_small");
	if (hit.type === "anime" || hit.type === "manga") return hit.imageUrl;
	if (hit.type === "music") return hit.coverUrl;
	if (hit.type === "book") return openLibraryImage(hit.coverId, "M");
	return tmdbImage(hit.poster_path, "w185");
}

function dismissWarning(itemKey: string) {
	const { [itemKey]: _, ...rest } = duplicateWarnings;
	duplicateWarnings = rest;
}
</script>

<div class="mx-auto my-8 max-w-[640px] px-4">
	<input
		type="search"
		bind:value={query}
		oninput={onInput}
		placeholder="Search movies, TV, games, anime, manga, music, books..."
		autocomplete="off"
		class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
	/>

	<div class="mt-3 flex flex-wrap gap-2">
		{#each TYPE_OPTIONS as opt (opt.value)}
			<button
				type="button"
				class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors {selectedType ===
				opt.value
					? 'bg-blue-600 text-white'
					: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
				onclick={() => onTypeChange(opt.value)}
			>
				{opt.label}
			</button>
		{/each}
	</div>

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
			{@const warning = duplicateWarnings[itemKey]}
			<li class="m-0">
				{#if warning}
					<div class="rounded-lg border border-amber-300 bg-amber-50 p-3">
						<p class="m-0 mb-2 text-sm text-amber-900">
							This looks like it might already exist as
							<strong>{warning.title}</strong> ({warning.mediaType}).
						</p>
						<div class="flex gap-2">
							<a
								href="/media/{warning.slug}"
								class="rounded bg-white px-3 py-1.5 text-sm font-medium text-amber-900 no-underline hover:bg-amber-100"
							>
								View existing
							</a>
							<form
								method="POST"
								action="?/pickResult"
								class="m-0"
								use:enhance={() => {
									importing = itemKey;
									return async ({ update }) => {
										importing = null;
										dismissWarning(itemKey);
										await update();
									};
								}}
							>
								<input type="hidden" name="type" value={hit.type} />
								<input type="hidden" name="externalId" value={hit.id} />
								<input type="hidden" name="confirmDuplicate" value="true" />
								<button
									type="submit"
									class="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
									disabled={importing === itemKey}
								>
									{importing === itemKey ? "Importing..." : "Import anyway"}
								</button>
							</form>
							<button
								type="button"
								class="rounded px-3 py-1.5 text-sm text-amber-700 hover:underline"
								onclick={() => dismissWarning(itemKey)}
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<form
						method="POST"
						action="?/pickResult"
						class="m-0"
						use:enhance={() => {
							importing = itemKey;
							return async ({ result, update }) => {
								importing = null;
								if (result.type === "failure" && result.status === 409 && result.data?.duplicate) {
									duplicateWarnings = {
										...duplicateWarnings,
										[itemKey]: result.data.duplicate as DuplicateInfo,
									};
									return;
								}
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
							{#if imageOf(hit)}
								<img
									src={imageOf(hit)}
									alt=""
									class="h-[69px] w-[46px] shrink-0 rounded object-cover"
								/>
							{:else}
								<div class="h-[69px] w-[46px] shrink-0 rounded bg-gray-200"></div>
							{/if}
							<div class="flex flex-1 flex-col">
								<span class="font-medium">{titleOf(hit)}</span>
								{#if subtitleOf(hit)}
									<span class="text-sm text-gray-600">{subtitleOf(hit)}</span>
								{/if}
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
				{/if}
			</li>
		{/each}
	</ul>
</div>