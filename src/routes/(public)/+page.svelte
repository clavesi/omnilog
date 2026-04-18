<script lang="ts">
    import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();
</script>

<div class="landing">
    <h1>Omnilog</h1>
    <p>Track everything you watch, read, and play.</p>
    {#if data?.user}
        <a href="/feed">Go to your feed</a>
    {:else}
        <div class="cta">
            <a href="/signup">Sign up</a>
            <a href="/login">Log in</a>
        </div>
    {/if}
</div>

<style>
    .landing {
        text-align: center;
        padding: 6rem 2rem;
    }
    .cta {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }
</style>
