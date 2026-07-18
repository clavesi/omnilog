<script lang="ts">
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data } = $props();
</script>

<div>
	<p class="mb-2 flex items-center gap-2 text-sm text-text-muted">
		<MediaTypeMark mediaType={data.item.mediaType} variant="dot" />
		<a href="/media/{data.item.slug}" class="text-accent no-underline hover:text-text">
			{data.item.title}
		</a>
	</p>
	<h1 class="mb-8 text-2xl">Tracks</h1>

	{#if data.tracks.length === 0}
		<p class="text-text-muted">No tracks found.</p>
	{:else}
		<ul class="m-0 list-none divide-y divide-border p-0">
			{#each data.tracks as track (track.id)}
				<li class="flex items-center justify-between gap-4 py-4">
					<div class="flex min-w-0 items-start gap-3">
						<span class="mt-0.5 shrink-0 font-mono text-sm text-text-muted">
							{String(track.number).padStart(2, "0")}
						</span>
						<div class="min-w-0">
							<a
								href="/media/{data.item.slug}/part/{track.id}"
								class="m-0 font-display font-medium text-text no-underline hover:text-accent"
							>
								{track.title}
							</a>
							{#if track.duration}
								<p class="m-0 mt-0.5 font-mono text-sm text-text-muted">
									{track.duration}
								</p>
							{/if}
							{#if track.averageRating}
								<p class="m-0 mt-0.5 font-mono text-sm text-text">
									★ {track.averageRating} ({track.ratingCount})
								</p>
							{/if}
						</div>
					</div>
					<a
						href={track.existingLogId
							? `/media/${data.item.slug}/part/${track.id}/log/${track.existingLogId}/edit?returnTo=${encodeURIComponent(`/media/${data.item.slug}/tracks`)}`
							: `/media/${data.item.slug}/part/${track.id}/log?returnTo=${encodeURIComponent(`/media/${data.item.slug}/tracks`)}`}
						class="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
					>
						{track.existingLogId ? "Edit" : "Log"}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>