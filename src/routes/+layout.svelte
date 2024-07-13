<script lang="ts">
	import "@fontsource/source-sans-pro/900.css";
	import "@fontsource-variable/open-sans/wdth-italic.css";
	import "../app.css";
	import { browser } from "$app/environment";
	import { Sun, Moon } from "lucide-svelte";
	import { Button } from "$lib/components/ui/button";

	let darkMode = true;
	function handleThemeSwitch() {
		darkMode = !darkMode;

		localStorage.setItem("theme", darkMode ? "dark" : "light");

		darkMode
			? document.documentElement.classList.add("dark")
			: document.documentElement.classList.remove("dark");
	}
	if (browser) {
		if (
			localStorage.theme === "dark" ||
			(!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
		) {
			darkMode = true;
		} else {
			darkMode = false;
		}
	}

	export let data;
</script>

<nav>
	<div class="flex items-center justify-between p-4 mb-2 text-xl border-b">
		<a href="/" class="text-4xl fontTitle text-mauve">omnilog</a>
		<div class="flex items-center gap-4">
			{#if darkMode}
				<Button variant="secondary" on:click={handleThemeSwitch}>
					<Moon />
				</Button>
			{:else}
				<Button variant="secondary" on:click={handleThemeSwitch}>
					<Sun />
				</Button>
			{/if}
			{#if data.username}
				<img src={data.imageUrl} alt="user profile" class="rounded-full size-12" />
				<Button href="/auth/logout" class="rounded-md">Sign Out</Button>
			{:else}
				<Button href="/auth/login" class="rounded-md">Login</Button>
			{/if}
		</div>
	</div>
</nav>
<slot></slot>
