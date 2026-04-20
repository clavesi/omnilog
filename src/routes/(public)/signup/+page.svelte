<script lang="ts">
import { enhance } from "$app/forms";
import type { ActionData } from "./$types";

let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
    <title>Sign up · Omnilog</title>
</svelte:head>

<div class="auth-page">
    <h1>Create your account</h1>

    <form method="post" use:enhance>
        <label>
            Email
            <input
                type="email"
                name="email"
                value={form?.email ?? ""}
                required
                autocomplete="email"
            />
        </label>

        <label>
            Username
            <input
                type="text"
                name="username"
                value={form?.username ?? ""}
                required
                autocomplete="username"
                minlength="3"
                maxlength="31"
            />
        </label>

        <label>
            Password
            <input
                type="password"
                name="password"
                required
                autocomplete="new-password"
                minlength="8"
            />
        </label>

        {#if form?.message}
            <p class="error">{form.message}</p>
        {/if}

        <button type="submit">Sign up</button>
    </form>

    <p>Already have an account? <a href="/login">Log in</a></p>
</div>

<style>
    .auth-page {
        max-width: 400px;
        margin: 4rem auto;
        padding: 0 1rem;
    }
    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.9rem;
    }
    input {
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    button {
        padding: 0.6rem;
        font-size: 1rem;
        cursor: pointer;
    }
    .error {
        color: #b00020;
        margin: 0;
    }
</style>
