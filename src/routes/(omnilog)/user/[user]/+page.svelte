<script lang="ts">
	let { data } = $props();
</script>

<div class="flex h-[calc(100vh-60px)] flex-col items-center justify-center gap-2">
	<p class="text-lg">Say 😀 to <b>{data.user.name}</b>!</p>
	<img src={data.user.image} alt="User Avatar" class="h-16 w-16 rounded-full" />
</div>
