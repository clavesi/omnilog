<script lang="ts">
import IconGithub from "./IconGithub.svelte";
import IconGoogle from "./IconGoogle.svelte";

type Props = {
	/** The ?next= value to carry through the OAuth flow. */
	next: string;
};

let { next }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	<a
		href="/login/github?next={encodeURIComponent(next)}"
		class="flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-2.5 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
	>
		<IconGithub size={18} />
		Continue with GitHub
	</a>
	<a
		href="/login/google?next={encodeURIComponent(next)}"
		class="flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-2.5 text-text no-underline transition-colors hover:border-text-muted hover:bg-surface"
	>
		<IconGoogle size={18} />
		Continue with Google
	</a>
</div>
