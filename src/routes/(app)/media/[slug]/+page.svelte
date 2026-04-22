<script lang="ts">
	import { isMetadataType } from "$lib/media-types";
	let { data } = $props();

	const { item, metadata, genres } = data;
	const year = item.releaseDate ? item.releaseDate.slice(0, 4) : null;
	const averageRatingNum =
		item.averageRating != null ? Number.parseFloat(item.averageRating) : NaN;
</script>

<article class="media">
	{#if item.backdropImageUrl}
		<div class="backdrop" style="background-image: url({item.backdropImageUrl})"></div>
	{/if}

	<div class="body">
		{#if item.coverImageUrl}
			<img class="poster" src={item.coverImageUrl} alt="" />
		{/if}

		<div class="info">
			<h1>
				{item.title}
				{#if year}
					<span class="year">({year})</span>{/if}
			</h1>

			{#if metadata && isMetadataType(metadata, "movie") && metadata.tagline}
				<p class="tagline">{metadata.tagline}</p>
			{/if}

			<ul class="facts">
				<li class="type-tag">{item.mediaType}</li>

				{#if metadata && isMetadataType(metadata, "movie") && metadata.runtime}
					<li>{metadata.runtime} min</li>
				{/if}

				{#if metadata && isMetadataType(metadata, "tv")}
					{#if metadata.number_of_seasons}
						<li>
							{metadata.number_of_seasons} season{metadata.number_of_seasons === 1
								? ""
								: "s"}
						</li>
					{/if}
					{#if metadata.number_of_episodes}
						<li>
							{metadata.number_of_episodes} episode{metadata.number_of_episodes === 1
								? ""
								: "s"}
						</li>
					{/if}
					{#if metadata.status}
						<li>{metadata.status}</li>
					{/if}
				{/if}

				{#if Number.isFinite(averageRatingNum)}
					<li class="rating">
						★ {(averageRatingNum / 2).toFixed(1)} ({item.ratingCount} rating{item.ratingCount ===
						1
							? ""
							: "s"})
					</li>
				{/if}
			</ul>

			{#if genres.length}
				<ul class="genres">
					{#each genres as g (g.slug)}
						<li>{g.name}</li>
					{/each}
				</ul>
			{/if}

			{#if item.description}
				<p class="description">{item.description}</p>
			{/if}

			<div class="actions">
				<!-- Placeholder — the log form lives here eventually -->
				<button type="button" class="log-btn" disabled>Log this (coming soon)</button>
			</div>
		</div>
	</div>
</article>

<style>
	.media {
		max-width: 900px;
		margin: 2rem auto;
		padding: 0 1rem;
	}
	.backdrop {
		height: 240px;
		background-size: cover;
		background-position: center;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.body {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 1.5rem;
	}
	.poster {
		width: 100%;
		border-radius: 0.5rem;
	}
	h1 {
		margin: 0 0 0.5rem;
	}
	.year {
		color: #666;
		font-weight: 400;
	}
	.tagline {
		font-style: italic;
		color: #666;
		margin: 0 0 1rem;
	}
	.facts {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		color: #666;
		font-size: 0.875rem;
	}
	.type-tag {
		text-transform: capitalize;
		background: #eee;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}
	.rating {
		color: #333;
		font-weight: 500;
	}
	.genres {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.genres li {
		background: #f3f4f6;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		color: #444;
	}
	.description {
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}
	.log-btn {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
	}
	.log-btn:disabled {
		background: #999;
		cursor: not-allowed;
	}
	@media (max-width: 600px) {
		.body {
			grid-template-columns: 1fr;
		}
		.poster {
			max-width: 200px;
		}
	}
</style>
