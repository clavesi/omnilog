<script lang="ts">
    import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();
</script>

<h1>Hello, {data.user.username}</h1>
<p>You're logged in. This is where your feed will go.</p>
