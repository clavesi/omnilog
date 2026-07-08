<script lang="ts">
import { enhance } from "$app/forms";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";
import { igdbImage, openLibraryImage, tmdbImage } from "$lib/media-images";
import { getMediaTypeColor, getSearchTypeColor, mediaTypeLabel } from "$lib/media-type-colors";
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
	return hit.title;
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
	if (hit.type === "music") return hit.primaryType ?? "Album";
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

<div>
	<h1 class="mb-6 font-display text-2xl">Search</h1>

	<input
		type="search"
		bind:value={query}
		oninput={onInput}
		placeholder="Search movies, TV, games, anime, manga, music, books..."
		autocomplete="off"
		class="w-full rounded-sm border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
	/>

	<div class="mt-4 flex flex-wrap gap-2">
		{#each TYPE_OPTIONS as opt (opt.value)}
			{@const typeColor = getSearchTypeColor(opt.value)}
			<button
				type="button"
				class="rounded-sm border px-3 py-1.5 text-sm font-medium motion-safe:transition-colors {selectedType !==
				opt.value
					? 'hover:border-text-muted'
					: ''}"
				style={selectedType === opt.value
					? `background-color: ${typeColor}; border-color: ${typeColor}; color: var(--color-bg)`
					: `border-color: var(--color-border); color: var(--color-text-muted)`}
				onclick={() => onTypeChange(opt.value)}
			>
				{opt.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<p class="mt-6 font-mono text-sm text-text-muted">Searching...</p>
	{:else if error}
		<p class="mt-6 text-danger">{error}</p>
	{:else if query.length >= 2 && results.length === 0}
		<p class="mt-6 text-text-muted">No results.</p>
	{/if}

	<ul class="m-0 mt-6 list-none divide-y divide-border p-0">
		{#each results as hit (`${hit.type}-${hit.id}`)}
			{@const itemKey = `${hit.type}-${hit.id}`}
			{@const warning = duplicateWarnings[itemKey]}
			{@const hitColor = getMediaTypeColor(hit.type)}
			<li class="m-0">
				{#if warning}
					<div class="border border-border bg-surface p-4" style="border-left: 3px solid {hitColor}">
						<p class="m-0 mb-3 text-sm text-text">
							This looks like it might already exist as
							<strong>{warning.title}</strong>
							<span class="font-mono text-text-muted">({mediaTypeLabel(warning.mediaType)})</span>.
						</p>
						<div class="flex flex-wrap gap-2">
							<a
								href="/media/{warning.slug}"
								class="rounded-sm border border-border bg-bg px-3 py-1.5 text-sm font-medium text-text no-underline transition-colors hover:border-text-muted"
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
									class="cursor-pointer rounded-sm border-none px-3 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
									style="background-color: {hitColor}"
									disabled={importing === itemKey}
								>
									{importing === itemKey ? "Importing..." : "Import anyway"}
								</button>
							</form>
							<button
								type="button"
								class="cursor-pointer rounded-sm border-none bg-transparent px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text"
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
							class="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-0 py-4 text-left font-[inherit] text-inherit transition-colors hover:bg-surface disabled:cursor-wait disabled:opacity-60"
							disabled={importing === itemKey}
						>
							<MediaTypeMark mediaType={hit.type} variant="tab" />
							{#if imageOf(hit)}
								<img
									src={imageOf(hit)}
									alt=""
									class="h-[69px] w-[46px] shrink-0 rounded-sm object-cover"
								/>
							{:else}
								<div class="h-[69px] w-[46px] shrink-0 rounded-sm bg-surface"></div>
							{/if}
							<div class="flex min-w-0 flex-1 flex-col gap-0.5">
								<span class="font-display font-medium">{titleOf(hit)}</span>
								{#if subtitleOf(hit)}
									<span class="text-sm text-text-muted">{subtitleOf(hit)}</span>
								{/if}
								<span class="font-mono text-sm text-text-muted">
									{typeLabel(hit)}
									{#if yearOf(hit)}
										· {yearOf(hit)}
									{/if}
								</span>
							</div>
							{#if importing === itemKey}
								<span class="font-mono text-sm text-text-muted italic">Importing...</span>
							{/if}
						</button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
</div>
