<script lang="ts">
import StaticStars from "./StaticStars.svelte";

type LogCardData = {
	id: string;
	rating: number | null;
	reviewTitle: string | null;
	reviewBody: string | null;
	containsSpoilers: boolean;
	isRewatch: boolean;
	isPublic: boolean;
	mediaPartId: string | null;
	loggedAt: string | null;
	createdAt: string | Date;
	mediaSlug: string;
	mediaTitle: string;
	mediaCoverUrl: string | null;
	username?: string;
};

type Props = {
	log: LogCardData;
	showMediaInfo?: boolean;
	showAuthor?: boolean;
	isOwner?: boolean;
	onDelete?: (logId: string) => void;
};

let { log, showMediaInfo = true, showAuthor = false, isOwner = false, onDelete }: Props = $props();

let revealSpoilers = $state(false);

const displayDate = $derived.by(() => {
	const d = log.loggedAt ?? (typeof log.createdAt === "string" ? log.createdAt : log.createdAt.toISOString());
	return new Date(d).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
});

let deleting = $state(false);

async function handleDelete() {
	if (!confirm("Delete this log? This can't be undone.")) return;
	deleting = true;
	try {
		const res = await fetch(`/api/logs/${log.id}`, {
			method: "DELETE",
		});
		if (res.ok) {
			onDelete?.(log.id);
		} else {
			alert("Failed to delete log");
		}
	} finally {
		deleting = false;
	}
}

const editHref = $derived(
	log.mediaPartId
		? `/media/${log.mediaSlug}/part/${log.mediaPartId}/log/${log.id}/edit`
		: `/media/${log.mediaSlug}/log/${log.id}/edit`,
);
</script>

<article
    class="border-b border-gray-200 py-4 transition-opacity duration-150"
    class:opacity-50={deleting}
>
    <div class="flex gap-4">
        {#if showMediaInfo}
            <a href="/media/{log.mediaSlug}" class="shrink-0">
                {#if log.mediaCoverUrl}
                    <img
                        src={log.mediaCoverUrl}
                        alt=""
                        class="h-[69px] w-[46px] rounded bg-gray-200 object-cover"
                    />
                {:else}
                    <div class="h-[69px] w-[46px] rounded bg-gray-200"></div>
                {/if}
            </a>
        {/if}

        <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2.5">
                {#if showMediaInfo}
                    <a
                        href="/media/{log.mediaSlug}"
                        class="font-semibold text-inherit no-underline hover:underline"
                        >{log.mediaTitle}</a
                    >
                {/if}
                {#if showAuthor && log.username}
                    <a
                        href="/u/{log.username}"
                        class="font-semibold text-blue-600 no-underline hover:underline"
                        >{log.username}</a
                    >
                {/if}
                {#if log.rating !== null}
                    <StaticStars value={log.rating} size={16} />
                {/if}
                {#if log.isRewatch}
                    <span
                        class="rounded-full bg-indigo-50 px-2 py-0.5 text-[0.6875rem] text-indigo-700"
                        >Rewatch</span
                    >
                {/if}
                {#if isOwner && !log.isPublic}
                    <span
                        class="rounded-full bg-gray-100 px-2 py-0.5 text-[0.6875rem] text-gray-500"
                        >Private</span
                    >
                {/if}
            </div>

            <time class="mt-0.5 block text-[0.8125rem] text-gray-500"
                >{displayDate}</time
            >

            {#if log.reviewBody}
                <div class="mt-2">
                    {#if log.reviewTitle}
                        <h3 class="mb-1 text-[0.9375rem]">{log.reviewTitle}</h3>
                    {/if}

                    {#if log.containsSpoilers && !revealSpoilers}
                        <button
                            type="button"
                            class="cursor-pointer rounded border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                            onclick={() => (revealSpoilers = true)}
                        >
                            Contains spoilers — click to reveal
                        </button>
                    {:else}
                        <p
                            class="m-0 leading-normal whitespace-pre-wrap text-gray-800"
                        >
                            {log.reviewBody}
                        </p>
                    {/if}
                </div>
            {/if}

            {#if isOwner}
                <div class="mt-2 flex gap-3 text-[0.8125rem]">
               		<a href={editHref} class="text-blue-600 no-underline hover:underline">
						Edit
					</a>

                    <button
                        type="button"
                        class="cursor-pointer border-none bg-transparent p-0 text-[0.8125rem] text-red-600 hover:underline"
                        onclick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</article>
