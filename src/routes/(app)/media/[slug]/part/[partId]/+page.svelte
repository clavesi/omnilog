<script lang="ts">
import LogCard from "$lib/components/LogCard.svelte";

let { data } = $props();

let deletedLogIds = $state(new Set<string>());
const visibleLogs = $derived(data.logs.filter((l) => !deletedLogIds.has(l.id)));

function handleDeleted(logId: string) {
	deletedLogIds = new Set([...deletedLogIds, logId]);
}

const backHref = $derived(
	data.season ? `/media/${data.item.slug}/season/${data.season.partNumber}` : `/media/${data.item.slug}/episodes`,
);

const logHref = $derived(
	`/media/${data.item.slug}/part/${data.part.id}/log?returnTo=${encodeURIComponent(
		`/media/${data.item.slug}/part/${data.part.id}`,
	)}`,
);
</script>

<main class="mx-auto my-8 max-w-[700px] px-4">
    <p class="mb-1 text-sm text-gray-500">
        <a href="/media/{data.item.slug}" class="text-blue-600 hover:underline"
            >{data.item.title}</a
        >
        ·
        <a href={backHref} class="text-blue-600 hover:underline">
            {data.season ? `Season ${data.season.partNumber}` : "Episodes"}
        </a>
    </p>

    <h1 class="mb-4 text-xl font-semibold">
        {data.part.partNumber}. {data.part.title}
    </h1>

    {#if data.part.releaseDate}
        <p class="mb-4 text-sm text-gray-500">{data.part.releaseDate}</p>
    {/if}

    {#if data.part.metadata?.overview}
        <p class="mb-6 leading-relaxed text-gray-700">
            {data.part.metadata.overview}
        </p>
    {/if}

    <a
        href={logHref}
        class="mb-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white no-underline hover:bg-blue-700"
    >
        Log this episode
    </a>

    <section class="border-t border-gray-200 pt-6">
        <h2 class="mb-4 text-lg font-semibold">Logs & Reviews</h2>
        {#if visibleLogs.length === 0}
            <p class="text-gray-500">No one has logged this episode yet.</p>
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
</main>
