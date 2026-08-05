<script lang="ts">
import { enhance } from "$app/forms";
import ConfirmDialog from "./ConfirmDialog.svelte";

type Author = { id: string; username: string; image: string | null };
type Comment = {
	id: string;
	body: string;
	createdAt: string | Date;
	editedAt: string | Date | null;
	author: Author;
	replies: Comment[];
};

type Props = {
	comments: Comment[];
	viewerId: string | null;
	/** The log's author — may delete anyone's comment on their own log. */
	logAuthorId: string;
	/** Null when the viewer may comment; otherwise why they can't. */
	denial: string | null;
	maxLength: number;
};

let { comments, viewerId, logAuthorId, denial, maxLength }: Props = $props();

let replyingTo = $state<string | null>(null);
let editingId = $state<string | null>(null);
let confirmDeleteId = $state<string | null>(null);
let confirmDeleteOpen = $state(false);
let deleteForm = $state<HTMLFormElement | null>(null);

const total = $derived(comments.reduce((n, c) => n + 1 + c.replies.length, 0));

const denialMessage: Record<string, string> = {
	not_signed_in: "Sign in to comment.",
	closed: "The author has turned off comments on this log.",
	followers_only: "Only people following the author can comment on this log.",
	log_not_visible: "You can't comment on this log.",
};

function canModify(c: Comment): boolean {
	return viewerId !== null && c.author.id === viewerId;
}

function canDelete(c: Comment): boolean {
	return viewerId !== null && (c.author.id === viewerId || logAuthorId === viewerId);
}

/**
 * Whether the reply box belongs under this thread. Replies are flattened to
 * one level, so replying to a reply still posts under its top-level parent —
 * but the box has to render beneath whichever comment was clicked.
 */
function isReplyTargetIn(c: Comment): boolean {
	return replyingTo === c.id || c.replies.some((r) => r.id === replyingTo);
}

function timeAgo(date: string | Date): string {
	const diff = Date.now() - new Date(date).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}
</script>

{#snippet avatar(author: Author, size: string)}
	<a href="/u/{author.username}" class="shrink-0">
		{#if author.image}
			<img src={author.image} alt="" class="{size} rounded-full object-cover" />
		{:else}
			<span
				class="{size} flex items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted"
			>
				{author.username.charAt(0).toUpperCase()}
			</span>
		{/if}
	</a>
{/snippet}

{#snippet commentBody(c: Comment, isReply: boolean)}
	<div class="flex gap-3">
		{@render avatar(c.author, isReply ? "h-6 w-6" : "h-8 w-8")}
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-baseline gap-2">
				<a href="/u/{c.author.username}" class="text-sm font-semibold text-text no-underline hover:text-accent">
					{c.author.username}
				</a>
				<span class="font-mono text-xs text-text-muted">{timeAgo(c.createdAt)}</span>
				{#if c.editedAt}
					<span class="font-mono text-xs text-text-muted">edited</span>
				{/if}
			</div>

			{#if editingId === c.id}
				<form
					method="POST"
					action="?/editComment"
					class="mt-2"
					use:enhance={() => {
						return async ({ update }) => {
							await update({ reset: false });
							editingId = null;
						};
					}}
				>
					<input type="hidden" name="commentId" value={c.id} />
					<textarea
						name="body"
						rows="3"
						maxlength={maxLength}
						class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:ring-1 focus:ring-accent"
						>{c.body}</textarea
					>
					<div class="mt-2 flex gap-2">
						<button
							type="submit"
							class="cursor-pointer rounded-sm border-none bg-accent px-3 py-1 font-inherit text-xs text-bg"
						>
							Save
						</button>
						<button
							type="button"
							class="cursor-pointer rounded-sm border border-border bg-transparent px-3 py-1 font-inherit text-xs text-text-muted hover:text-text"
							onclick={() => (editingId = null)}
						>
							Cancel
						</button>
					</div>
				</form>
			{:else}
				<p class="m-0 mt-1 text-sm leading-relaxed whitespace-pre-wrap text-text">{c.body}</p>

				<div class="mt-1.5 flex gap-3">
					{#if !denial}
						<button
							type="button"
							class="cursor-pointer border-none bg-transparent p-0 font-mono text-xs text-text-muted hover:text-text"
							onclick={() => (replyingTo = replyingTo === c.id ? null : c.id)}
						>
							Reply
						</button>
					{/if}
					{#if canModify(c)}
						<button
							type="button"
							class="cursor-pointer border-none bg-transparent p-0 font-mono text-xs text-text-muted hover:text-text"
							onclick={() => (editingId = c.id)}
						>
							Edit
						</button>
					{/if}
					{#if canDelete(c)}
						<button
							type="button"
							class="cursor-pointer border-none bg-transparent p-0 font-mono text-xs text-text-muted hover:text-danger"
							onclick={() => {
								confirmDeleteId = c.id;
								confirmDeleteOpen = true;
							}}
						>
							Delete
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet commentForm(parentId: string | null)}
	<form
		method="POST"
		action="?/comment"
		class={parentId ? "mt-3 ml-9" : "mb-8"}
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				replyingTo = null;
			};
		}}
	>
		{#if parentId}
			<input type="hidden" name="parentCommentId" value={parentId} />
		{/if}
		<textarea
			name="body"
			rows={parentId ? 2 : 3}
			maxlength={maxLength}
			required
			placeholder={parentId ? "Write a reply..." : "Add a comment..."}
			class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
		></textarea>
		<div class="mt-2 flex gap-2">
			<button
				type="submit"
				class="cursor-pointer rounded-sm border-none bg-accent px-3 py-1.5 font-inherit text-sm text-bg transition-opacity hover:opacity-90"
			>
				{parentId ? "Reply" : "Comment"}
			</button>
			{#if parentId}
				<button
					type="button"
					class="cursor-pointer rounded-sm border border-border bg-transparent px-3 py-1.5 font-inherit text-sm text-text-muted hover:text-text"
					onclick={() => (replyingTo = null)}
				>
					Cancel
				</button>
			{/if}
		</div>
	</form>
{/snippet}

<section>
	<h2 class="mb-5 text-lg">
		{total}
		{total === 1 ? "comment" : "comments"}
	</h2>

	{#if denial}
		<p class="mb-8 rounded-sm border border-border px-3 py-2 text-sm text-text-muted">
			{denialMessage[denial] ?? "You can't comment on this log."}
		</p>
	{:else}
		{@render commentForm(null)}
	{/if}

	{#if comments.length === 0}
		<p class="text-sm text-text-muted">No comments yet.</p>
	{:else}
		<ul class="m-0 list-none space-y-6 p-0">
			{#each comments as c (c.id)}
				<li>
					{@render commentBody(c, false)}

					{#if c.replies.length > 0}
						<ul class="m-0 mt-4 ml-9 list-none space-y-4 border-l border-border p-0 pl-4">
							{#each c.replies as r (r.id)}
								<li>{@render commentBody(r, true)}</li>
							{/each}
						</ul>
					{/if}

					{#if isReplyTargetIn(c)}
						{@render commentForm(replyingTo)}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!--
  ConfirmDialog takes an onconfirm callback rather than a slot, so the delete
  runs through a hidden form submitted programmatically. Keeps deletion on the
  same form action as everything else instead of introducing a second
  mechanism just for this one case.
-->
<form
	method="POST"
	action="?/deleteComment"
	class="hidden"
	bind:this={deleteForm}
	use:enhance={() => {
		return async ({ update }) => {
			await update({ reset: false });
			confirmDeleteId = null;
		};
	}}
>
	<input type="hidden" name="commentId" value={confirmDeleteId ?? ""} />
</form>

<ConfirmDialog
	bind:open={confirmDeleteOpen}
	title="Delete comment"
	description="Delete this comment? This can't be undone, and any replies to it are deleted too."
	confirmLabel="Delete"
	danger
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (confirmDeleteId = null)}
/>
