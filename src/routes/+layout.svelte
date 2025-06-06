<script lang="ts">
	import '@fontsource-variable/inter';
	import '../app.css';

	let { children } = $props();
</script>

<!-- 
Prevent flash of unstyled content on all pages
Otherwise, if user prefers dark, it will flash the light mode briefly 
-->
<svelte:head>
	<script>
		try {
			if (
				localStorage.getItem('theme') === 'dark' ||
				(!localStorage.getItem('theme') &&
					window.matchMedia('(prefers-color-scheme: dark)').matches)
			) {
				document.documentElement.classList.add('dark');
			}
		} catch (e) {}
	</script>
</svelte:head>

{@render children()}
