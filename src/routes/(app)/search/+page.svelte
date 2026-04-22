<!-- src/routes/search/+page.svelte -->
<script lang="ts">
import { enhance } from "$app/forms";
import type { TmdbSearchHit } from "$lib/server/tmdb";
import { tmdbImage } from "$lib/tmdb-image";

let query = $state("");
let results = $state<TmdbSearchHit[]>([]);
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

function titleOf(hit: TmdbSearchHit): string {
	return hit.type === "movie" ? hit.title : hit.name;
}

function yearOf(hit: TmdbSearchHit): string {
	const d = hit.type === "movie" ? hit.release_date : hit.first_air_date;
	return d ? d.slice(0, 4) : "";
}
</script>

<div class="search">
	<input
		type="search"
		bind:value={query}
		oninput={onInput}
		placeholder="Search movies and TV shows..."
		autocomplete="off"
	/>

	{#if loading}
		<p class="hint">Searching...</p>
	{:else if error}
		<p class="hint error">{error}</p>
	{:else if query.length >= 2 && results.length === 0}
		<p class="hint">No results.</p>
	{/if}

	<ul class="results">
		{#each results as hit (`${hit.type}-${hit.id}`)}
			{@const itemKey = `${hit.type}-${hit.id}`}
			<li>
				<form
					method="POST"
					action="?/pickResult"
					use:enhance={() => {
						importing = itemKey;
						return async ({ update }) => {
							importing = null;
							await update();
						};
					}}
				>
					<input type="hidden" name="type" value={hit.type} />
					<input type="hidden" name="tmdbId" value={hit.id} />
					<button type="submit" class="result-btn" disabled={importing === itemKey}>
						{#if hit.poster_path}
							<img src={tmdbImage(hit.poster_path, "w185")} alt="" />
						{:else}
							<div class="poster-placeholder"></div>
						{/if}
						<div class="meta">
							<span class="title">{titleOf(hit)}</span>
							<span class="subtitle">
								{hit.type === "movie" ? "Movie" : "TV"}
								{#if yearOf(hit)}
									· {yearOf(hit)}{/if}
							</span>
						</div>
						{#if importing === itemKey}
							<span class="loading">Importing...</span>
						{/if}
					</button>
				</form>
			</li>
		{/each}
	</ul>
</div>

<style>
	.search {
		max-width: 640px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	input[type="search"] {
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
	}
	.hint {
		color: #666;
		margin-top: 1rem;
	}
	.hint.error {
		color: #c33;
	}
	.results {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
	}
	.results li {
		margin: 0;
	}
	.results form {
		margin: 0;
	}
	.result-btn {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		width: 100%;
		padding: 0.5rem;
		background: none;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: inherit;
	}
	.result-btn:hover:not(:disabled) {
		background: #f0f0f0;
	}
	.result-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.result-btn img,
	.poster-placeholder {
		width: 46px;
		height: 69px;
		object-fit: cover;
		background: #eee;
		border-radius: 0.25rem;
		flex-shrink: 0;
	}
	.meta {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.title {
		font-weight: 500;
	}
	.subtitle {
		color: #666;
		font-size: 0.875rem;
	}
	.loading {
		color: #666;
		font-size: 0.875rem;
		font-style: italic;
	}
</style>
