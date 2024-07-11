import type { SvelteComponent } from "svelte";
import Github from "./github.svelte";
import Google from "./google.svelte";

export type Icon = SvelteComponent;
export const Icons = {
	github: Github,
	google: Google
};
