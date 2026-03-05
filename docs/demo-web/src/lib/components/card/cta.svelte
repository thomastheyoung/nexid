<script lang="ts">
	import type { Snippet } from 'svelte';
	export type Variant = 'blue' | 'indigo' | 'lime' | 'orange';

	interface Props {
		children: Snippet;
		onclick: EventListener;
		disabled?: boolean;
		variant: Variant;
	}
	let { children, onclick, disabled = false, variant = 'blue' }: Props = $props();
</script>

<button
	{disabled}
	onclick={(e) => onclick(e)}
	class={[
		'max-h-10 place-self-center rounded-lg border-b-[4px] px-6 py-2 text-sm font-semibold text-white transition-all',
		variant === 'blue' && 'border-blue-600 bg-blue-500',
		variant === 'lime' && 'border-lime-700 bg-lime-600',
		variant === 'indigo' && 'border-indigo-600 bg-indigo-500',
		variant === 'orange' && 'border-amber-700 bg-orange-500',
		!disabled &&
			'cursor-pointer hover:brightness-110 active:translate-y-[1px] active:border-b-[4px] active:brightness-90'
	]}
>
	{@render children()}
</button>
