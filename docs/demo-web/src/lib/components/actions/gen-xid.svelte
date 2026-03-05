<script lang="ts">
  import Output from '$lib/components/card/output.svelte';
  import PlusIcon from '~icons/fa6-solid/plus';

  interface Props {
    output: string | undefined | null;
    onclick: Function;
    disabled?: boolean;
  }

  let { output, onclick, disabled }: Props = $props();
</script>

<div class="relative mt-3 flex w-full flex-row items-center">
  <span class="flex pr-3">
    <button
      {disabled}
      aria-label="Create new XID"
      title="Create new XID"
      onclick={() => onclick()}
      class="
				group flex h-8 w-8 content-center items-center justify-center rounded-full shadow-md shadow-gray-400
				{disabled
        ? 'cursor-not-allowed disabled:bg-gray-600'
        : 'cursor-pointer bg-lime-600 transition-all hover:bg-lime-700 active:translate-y-[1px] active:bg-lime-800'}"
    >
      <PlusIcon class={disabled ? 'text-gray-300' : 'text-indigo-50 active:text-white'} />
    </button>
  </span>

  <Output {disabled}>{output || '< Generate a new XID'}</Output>
</div>
