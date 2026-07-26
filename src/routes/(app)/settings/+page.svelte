<script lang="ts">
import { enhance } from "$app/forms";

let { data, form } = $props();

// svelte-ignore state_referenced_locally -- intentional; the $effect below
// resyncs on every data change, this is just the initial value.
let avatarUrl = $state(data.profile.avatarUrl ?? "");
// svelte-ignore state_referenced_locally
let bio = $state(data.profile.bio ?? "");
const BIO_MAX = 500;
const bioRemaining = $derived(BIO_MAX - bio.length);
let profileSubmitting = $state(false);

// svelte-ignore state_referenced_locally
let newEmail = $state(data.profile.email);
let emailSubmitting = $state(false);

$effect(() => {
	avatarUrl = data.profile.avatarUrl ?? "";
	bio = data.profile.bio ?? "";
	newEmail = data.profile.email;
});

let currentPassword = $state("");
let newPassword = $state("");
let confirmPassword = $state("");
let passwordSubmitting = $state(false);

let showDeleteForm = $state(false);
let deletePassword = $state("");
let deleteConfirmText = $state("");
let deleteSubmitting = $state(false);
</script>

<div class="mx-auto max-w-150">
	<h1 class="mb-8 text-2xl">Account settings</h1>

	<section class="mb-8 rounded-sm border border-border p-5">
		<h2 class="mb-4 text-base">Profile</h2>
		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				profileSubmitting = true;
				return async ({ update }) => {
					await update();
					profileSubmitting = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<p class="m-0 font-mono text-sm text-text-muted">Username: {data.profile.username}</p>
			<label class="flex flex-col gap-1 text-sm">
				Avatar URL
				<input
					type="text"
					name="avatarUrl"
					bind:value={avatarUrl}
					placeholder="https://..."
					class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Bio
				<textarea
					name="bio"
					bind:value={bio}
					rows="3"
					maxlength={BIO_MAX}
					class="w-full resize-y rounded-sm border border-border bg-bg px-3 py-2 text-text"
				></textarea>
				<span class="self-end font-mono text-xs {bioRemaining <= 0 ? 'text-danger' : 'text-text-muted'}">
					{bioRemaining}
				</span>
			</label>
			{#if form?.profileError}
				<p class="m-0 text-sm text-danger">{form.profileError}</p>
			{/if}
			{#if form?.profileSuccess}
				<p class="m-0 text-sm text-accent">Saved.</p>
			{/if}
			<button
				type="submit"
				disabled={profileSubmitting}
				class="self-start rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{profileSubmitting ? "Saving..." : "Save"}
			</button>
		</form>
	</section>

	<section class="mb-8 rounded-sm border border-border p-5">
		<h2 class="mb-4 text-base">Email</h2>
		<form
			method="POST"
			action="?/updateEmail"
			use:enhance={() => {
				emailSubmitting = true;
				return async ({ update }) => {
					await update();
					emailSubmitting = false;
				};
			}}
			class="flex flex-col gap-4"
		>
			<label class="flex flex-col gap-1 text-sm">
				New email
				<input
					type="email"
					name="email"
					bind:value={newEmail}
					required
					class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
				/>
			</label>
			{#if form?.emailError}
				<p class="m-0 text-sm text-danger">{form.emailError}</p>
			{/if}
			{#if form?.emailSuccess}
				<p class="m-0 text-sm text-accent">Email updated.</p>
			{/if}
			<button
				type="submit"
				disabled={emailSubmitting}
				class="self-start rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{emailSubmitting ? "Saving..." : "Update email"}
			</button>
		</form>
	</section>

	<section class="mb-8 rounded-sm border border-border p-5">
		<h2 class="mb-4 text-base">Password</h2>
		<form
			method="POST"
			action="?/updatePassword"
			use:enhance={() => {
				passwordSubmitting = true;
				return async ({ update, result }) => {
					await update();
					passwordSubmitting = false;
					if (result.type === "success") {
						currentPassword = "";
						newPassword = "";
						confirmPassword = "";
					}
				};
			}}
			class="flex flex-col gap-4"
		>
			<label class="flex flex-col gap-1 text-sm">
				Current password
				<input
					type="password"
					name="currentPassword"
					bind:value={currentPassword}
					required
					class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				New password
				<input
					type="password"
					name="newPassword"
					bind:value={newPassword}
					required
					class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				Confirm new password
				<input
					type="password"
					name="confirmPassword"
					bind:value={confirmPassword}
					required
					class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
				/>
			</label>
			<p class="m-0 text-sm text-text-muted">Changing your password signs you out of any other active sessions.</p>
			{#if form?.passwordError}
				<p class="m-0 text-sm text-danger">{form.passwordError}</p>
			{/if}
			{#if form?.passwordSuccess}
				<p class="m-0 text-sm text-accent">Password updated.</p>
			{/if}
			<button
				type="submit"
				disabled={passwordSubmitting}
				class="self-start rounded-sm bg-accent px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
			>
				{passwordSubmitting ? "Saving..." : "Update password"}
			</button>
		</form>
	</section>

	<section class="rounded-sm border border-danger p-5">
		<h2 class="mb-2 text-base text-danger">Delete account</h2>
		<p class="mb-4 text-sm text-text-muted">
			Permanently deletes your account and everything tied to it — logs, favorites, lists, sessions. This can't be undone.
		</p>

		{#if !showDeleteForm}
			<button
				type="button"
				class="rounded-sm border border-danger px-4 py-2 text-sm text-danger transition-colors hover:bg-danger hover:text-text"
				onclick={() => (showDeleteForm = true)}
			>
				Delete my account
			</button>
		{:else}
			<form
				method="POST"
				action="?/deleteAccount"
				use:enhance={() => {
					deleteSubmitting = true;
					return async ({ update }) => {
						await update();
						deleteSubmitting = false;
					};
				}}
				class="flex flex-col gap-4"
			>
				<label class="flex flex-col gap-1 text-sm">
					Current password
					<input
						type="password"
						name="currentPassword"
						bind:value={deletePassword}
						required
						class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					Type "DELETE" to confirm
					<input
						type="text"
						name="confirmText"
						bind:value={deleteConfirmText}
						required
						class="w-full rounded-sm border border-border bg-bg px-3 py-2 text-text"
					/>
				</label>
				{#if form?.deleteError}
					<p class="m-0 text-sm text-danger">{form.deleteError}</p>
				{/if}
				<div class="flex gap-3">
					<button
						type="submit"
						disabled={deleteSubmitting}
						class="rounded-sm bg-danger px-5 py-2 text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
					>
						{deleteSubmitting ? "Deleting..." : "Permanently delete account"}
					</button>
					<button
						type="button"
						class="px-3 py-2 text-sm text-text-muted hover:text-text"
						onclick={() => (showDeleteForm = false)}
					>
						Cancel
					</button>
				</div>
			</form>
		{/if}
	</section>
</div>