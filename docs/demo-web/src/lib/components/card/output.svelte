<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		disabled?: boolean;
	}
	let { children, disabled }: Props = $props();
</script>

<div
	class="
		fira-code min-h-10 w-full content-center rounded-sm px-3.5 py-2.5 text-[0.8em] outline-[.5px] outline-slate-600/60
	{disabled ? 'cursor-not-allowed bg-zinc-300 text-zinc-300' : 'bg-white text-gray-800'}
	"
>
	{#if !disabled}
		{@render children?.()}
	{/if}
</div>

<style>
	.fira-code {
		font-family: 'Fira Code', monospace;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;
	}
</style>
