<script lang="ts">
import { Dialog } from "bits-ui";

let {
	open = $bindable(false),
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	danger = false,
	onconfirm,
	oncancel,
}: {
	open?: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
	onconfirm: () => void;
	oncancel?: () => void;
} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
		/>
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border bg-bg p-6 shadow-lg"
		>
			<Dialog.Title class="mb-2 text-base font-medium text-text">
				{title}
			</Dialog.Title>
			<Dialog.Description class="mb-6 text-sm text-text-muted">
				{description}
			</Dialog.Description>
			<div class="flex justify-end gap-3">
				<Dialog.Close
					class="rounded-sm border border-border px-4 py-2 text-sm text-text transition-colors hover:border-text-muted hover:bg-surface"
					onclick={() => oncancel?.()}
				>
					{cancelLabel}
				</Dialog.Close>
				<button
					type="button"
					class="rounded-sm px-4 py-2 text-sm transition-opacity hover:opacity-90 {danger
						? 'bg-danger text-text'
						: 'bg-accent text-bg'}"
					onclick={() => {
						open = false;
						onconfirm();
					}}
				>
					{confirmLabel}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
