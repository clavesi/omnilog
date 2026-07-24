<script lang="ts">
import { enhance } from "$app/forms";
import MediaTypeMark from "$lib/components/MediaTypeMark.svelte";

let { data, form } = $props();

type Tier = "arc" | "saga";

// "all" | "saga:<id>" | "arc:<id>" — drives the dropdown selector.
let selectedView = $state("all");

type FilteredGroup = { arcId: string | null; label: string | null; isFiller: boolean; items: typeof data.episodes };

/** Groups already-tagged episodes by consecutive matching key — simpler
 * than the server's range-based grouping since membership is already
 * resolved per episode, this just needs to detect where it changes. */
function groupConsecutive(items: typeof data.episodes, keyFn: (ep: (typeof data.episodes)[number]) => string | null) {
	const groups: FilteredGroup[] = [];
	for (const item of items) {
		const key = keyFn(item);
		const arc = key ? data.arcs.find((a) => a.id === key) : undefined;
		const last = groups[groups.length - 1];
		if (last && last.arcId === key) {
			last.items.push(item);
		} else {
			groups.push({ arcId: key, label: arc?.title ?? null, isFiller: arc?.isFiller ?? false, items: [item] });
		}
	}
	return groups;
}

const filteredView = $derived.by(() => {
	if (selectedView === "all") return { mode: "all" as const };

	if (selectedView.startsWith("saga:")) {
		const sagaId = selectedView.slice("saga:".length);
		const matching = data.episodes.filter((ep) => ep.sagaId === sagaId);
		return { mode: "saga" as const, groups: groupConsecutive(matching, (ep) => ep.arcId) };
	}

	const arcId = selectedView.slice("arc:".length);
	const matching = data.episodes.filter((ep) => ep.arcId === arcId);
	return { mode: "arc" as const, items: matching };
});

let showAddForm = $state<Tier | null>(null);
let addTitle = $state("");
let addEpisodes = $state("");
let addFiller = $state(false);
let submitting = $state(false);

// Which part (tier + id) is currently showing its inline edit form, if any.
let editing = $state<{ tier: Tier; id: string } | null>(null);
let editTitle = $state("");
let editEpisodes = $state("");
let editFiller = $state(false);
let deletingId = $state<string | null>(null);

function startAdding(tier: Tier) {
	showAddForm = tier;
	addTitle = "";
	addEpisodes = "";
	addFiller = false;
}

function startEditing(tier: Tier, part: { id: string; title: string | null; rangesText: string; isFiller: boolean }) {
	editing = { tier, id: part.id };
	editTitle = part.title ?? "";
	editEpisodes = part.rangesText;
	editFiller = part.isFiller;
}

async function deletePart(id: string, label: string) {
	if (!confirm(`Delete this ${label}? Episodes inside it aren't affected — they just go back to ungrouped.`)) return;
	deletingId = id;
	const body = new FormData();
	body.set("partId", id);
	await fetch("?/deleteTier", { method: "POST", body });
	deletingId = null;
	location.reload();
}
</script>

{#snippet episodeRow(ep: (typeof data.episodes)[number])}
	<li class="flex items-center justify-between gap-4 py-4">
		<div class="flex min-w-0 items-start gap-3">
			<span class="mt-0.5 shrink-0 font-mono text-sm text-text-muted">
				{ep.number !== null ? String(ep.number).padStart(2, "0") : "—"}
			</span>
			<div class="min-w-0">
				<a
					href="/media/{data.item.slug}/part/{ep.id}"
					class="m-0 font-display font-medium text-text no-underline hover:text-accent"
				>
					{ep.title}
					{#if ep.isFiller}
						<span class="ml-1 rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-text-muted">
							Filler
						</span>
					{/if}
				</a>
				{#if ep.releaseDate}
					<p class="m-0 mt-0.5 font-mono text-sm text-text-muted">
						{ep.releaseDate}
					</p>
				{/if}
				{#if ep.averageRating}
					<p class="m-0 mt-0.5 font-mono text-sm text-text">
						★ {ep.averageRating} ({ep.ratingCount})
					</p>
				{/if}
			</div>
		</div>
		<a
			href={ep.existingLogId
				? `/media/${data.item.slug}/part/${ep.id}/log/${ep.existingLogId}/edit?returnTo=${encodeURIComponent(`/media/${data.item.slug}/episodes`)}`
				: `/media/${data.item.slug}/part/${ep.id}/log?returnTo=${encodeURIComponent(`/media/${data.item.slug}/episodes`)}`}
			class="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-sm text-text-muted no-underline transition-colors hover:border-text-muted hover:text-text"
		>
			{ep.existingLogId ? "Edit" : "Log"}
		</a>
	</li>
{/snippet}

{#snippet addForm(tier: Tier)}
	<form
		method="POST"
		action="?/addTier"
		use:enhance={() => {
			submitting = true;
			return async ({ update, result }) => {
				await update();
				submitting = false;
				if (result.type === "success") showAddForm = null;
			};
		}}
		class="mb-8 flex flex-wrap items-end gap-3 rounded-sm border border-border p-4"
	>
		<input type="hidden" name="tier" value={tier} />
		<label class="flex flex-1 flex-col gap-1 text-sm">
			{tier === "saga" ? "Saga name" : "Arc name"}
			<input
				type="text"
				name="title"
				bind:value={addTitle}
				placeholder={tier === "saga" ? "e.g. East Blue Saga" : "e.g. Loguetown Arc"}
				required
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<label class="flex flex-1 flex-col gap-1 text-sm">
			Episodes
			<input
				type="text"
				name="episodes"
				bind:value={addEpisodes}
				placeholder="e.g. 45, 48-53"
				required
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<label class="flex items-center gap-2 text-sm text-text-muted">
			<input type="checkbox" name="isFiller" bind:checked={addFiller} />
			Filler
		</label>
		<button
			type="submit"
			disabled={submitting}
			class="rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
		>
			{submitting ? "Adding..." : "Add"}
		</button>
		<button type="button" class="px-3 py-2 text-sm text-text-muted hover:text-text" onclick={() => (showAddForm = null)}>
			Cancel
		</button>
	</form>
{/snippet}

{#snippet editForm(tier: Tier, partId: string)}
	<form
		method="POST"
		action="?/editTier"
		use:enhance={() => {
			submitting = true;
			return async ({ update, result }) => {
				await update();
				submitting = false;
				if (result.type === "success") editing = null;
			};
		}}
		class="mt-6 mb-2 flex flex-wrap items-end gap-3 rounded-sm border border-border p-4"
	>
		<input type="hidden" name="tier" value={tier} />
		<input type="hidden" name="partId" value={partId} />
		<label class="flex flex-1 flex-col gap-1 text-sm">
			{tier === "saga" ? "Saga name" : "Arc name"}
			<input
				type="text"
				name="title"
				bind:value={editTitle}
				required
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<label class="flex flex-1 flex-col gap-1 text-sm">
			Episodes
			<input
				type="text"
				name="episodes"
				bind:value={editEpisodes}
				placeholder="e.g. 45, 48-53"
				required
				class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
			/>
		</label>
		<label class="flex items-center gap-2 text-sm text-text-muted">
			<input type="checkbox" name="isFiller" bind:checked={editFiller} />
			Filler
		</label>
		<button
			type="submit"
			disabled={submitting}
			class="rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
		>
			{submitting ? "Saving..." : "Save"}
		</button>
		<button type="button" class="px-3 py-2 text-sm text-text-muted hover:text-text" onclick={() => (editing = null)}>
			Cancel
		</button>
	</form>
{/snippet}

{#snippet tierHeading(
	tier: Tier,
	label: string,
	isFiller: boolean,
	part: { id: string; title: string | null; rangesText: string; isFiller: boolean } | undefined,
	headingClass: string,
)}
	<div class="flex items-center gap-3 {headingClass}">
		<h2 class="m-0 text-text-muted uppercase">{label}</h2>
		{#if isFiller}
			<span class="rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs text-text-muted">Filler</span>
		{/if}
		{#if data.isAdmin && part}
			<button type="button" class="font-mono text-xs text-text-muted hover:text-text" onclick={() => startEditing(tier, part)}>
				Edit
			</button>
			<button
				type="button"
				class="font-mono text-xs text-text-muted hover:text-danger"
				disabled={deletingId === part.id}
				onclick={() => deletePart(part.id, tier)}
			>
				{deletingId === part.id ? "Deleting..." : "Delete"}
			</button>
		{/if}
	</div>
{/snippet}

<div>
	<p class="mb-2 flex items-center gap-2 text-sm text-text-muted">
		<MediaTypeMark mediaType={data.item.mediaType} variant="dot" />
		<a href="/media/{data.item.slug}" class="text-accent no-underline hover:text-text">
			{data.item.title}
		</a>
	</p>
	<h1 class="mb-6 text-2xl">Episodes</h1>

	{#if data.episodes.length === 0}
		<p class="text-text-muted">No episodes found.</p>
	{:else}
		{#if data.isAdmin}
			<div class="mb-6 flex gap-3">
				{#if showAddForm === null}
					<button
						type="button"
						class="rounded-sm border border-dashed border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text"
						onclick={() => startAdding("saga")}
					>
						+ Add saga
					</button>
					<button
						type="button"
						class="rounded-sm border border-dashed border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text"
						onclick={() => startAdding("arc")}
					>
						+ Add arc
					</button>
				{/if}
			</div>
			{#if showAddForm}
				{@render addForm(showAddForm)}
			{/if}
		{:else}
			<p class="mb-6 text-sm text-text-muted">
				Story arcs and sagas are curated by admins — reach out to one if you'd like some added
				for this series.
			</p>
		{/if}

		{#if form?.error}
			<p class="mb-6 text-sm text-danger">{form.error}</p>
		{/if}

		{#if data.arcs.length > 0 || data.sagas.length > 0}
			<label class="mb-6 flex items-center gap-2 text-sm text-text-muted">
				View
				<select bind:value={selectedView} class="rounded-sm border border-border bg-bg px-3 py-2 text-text">
					<option value="all">All episodes</option>
					{#if data.sagas.length > 0}
						<optgroup label="Sagas">
							{#each data.sagas as saga (saga.id)}
								<option value="saga:{saga.id}">{saga.title}</option>
							{/each}
						</optgroup>
					{/if}
					{#if data.arcs.length > 0}
						<optgroup label="Arcs">
							{#each data.arcs as arc (arc.id)}
								<option value="arc:{arc.id}">{arc.title}</option>
							{/each}
						</optgroup>
					{/if}
				</select>
			</label>
		{/if}

		{#if filteredView.mode === "all"}
			{#each data.segments as sagaSeg (sagaSeg.arcSegments[0].items[0].id)}
				{#if sagaSeg.sagaLabel && sagaSeg.sagaId}
					{@const saga = data.sagas.find((s) => s.id === sagaSeg.sagaId)}
					{#if editing?.tier === "saga" && editing.id === sagaSeg.sagaId && saga}
						{@render editForm("saga", saga.id)}
					{:else}
						{@render tierHeading("saga", sagaSeg.sagaLabel, sagaSeg.sagaIsFiller, saga, "mt-10 mb-3 text-base")}
					{/if}
				{/if}

				{#each sagaSeg.arcSegments as arcSeg (arcSeg.items[0].id)}
					{#if arcSeg.label && arcSeg.partId}
						{@const arc = data.arcs.find((a) => a.id === arcSeg.partId)}
						{#if editing?.tier === "arc" && editing.id === arcSeg.partId && arc}
							{@render editForm("arc", arc.id)}
						{:else}
							{@render tierHeading("arc", arcSeg.label, arcSeg.isFiller, arc, "mt-6 mb-2 text-sm")}
						{/if}
					{/if}
					<ul class="m-0 list-none divide-y divide-border p-0">
						{#each arcSeg.items as ep (ep.id)}
							{@render episodeRow(ep)}
						{/each}
					</ul>
				{/each}
			{/each}
		{:else if filteredView.mode === "saga"}
			{#each filteredView.groups as group (group.items[0].id)}
				{#if group.label && group.arcId}
					{@const arc = data.arcs.find((a) => a.id === group.arcId)}
					{#if editing?.tier === "arc" && editing.id === group.arcId && arc}
						{@render editForm("arc", arc.id)}
					{:else}
						{@render tierHeading("arc", group.label, group.isFiller, arc, "mt-6 mb-2 text-sm")}
					{/if}
				{/if}
				<ul class="m-0 list-none divide-y divide-border p-0">
					{#each group.items as ep (ep.id)}
						{@render episodeRow(ep)}
					{/each}
				</ul>
			{/each}
		{:else}
			<ul class="m-0 list-none divide-y divide-border p-0">
				{#each filteredView.items as ep (ep.id)}
					{@render episodeRow(ep)}
				{/each}
			</ul>
		{/if}
	{/if}
</div>
