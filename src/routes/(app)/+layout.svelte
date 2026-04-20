<script lang="ts">
import type { Snippet } from "svelte";
import type { LayoutData } from "./$types";

let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<header>
    <a href="/feed" class="logo">Omnilog</a>
    <nav>
        <a href="/feed">Feed</a>
        <a href="/profile">Profile</a>
        <form method="post" action="/logout">
            <button type="submit">Log out</button>
        </form>
    </nav>
</header>

<main>
    {@render children()}
</main>

<style>
    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        border-bottom: 1px solid #eee;
    }
    .logo {
        font-weight: bold;
        text-decoration: none;
        color: inherit;
    }
    nav {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    nav form {
        display: inline;
    }
    nav button {
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
        font: inherit;
        padding: 0;
    }
    main {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }
</style>
