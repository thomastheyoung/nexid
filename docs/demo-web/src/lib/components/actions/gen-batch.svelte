<script lang="ts">
  import Output from '$lib/components/card/output.svelte';
  import { PERF_TEST_COUNT } from '$lib/performance-test';
  import RunIcon from '~icons/fa6-solid/person-running';

  interface Props {
    output: number | undefined | null;
    onclick: Function;
    disabled?: boolean;
  }

  let { output, onclick, disabled }: Props = $props();

  function formatResult(speed: number) {
    const elapsed = speed.toFixed(2);
    const idsPerSecond = Math.round(PERF_TEST_COUNT / (speed / 1000)).toLocaleString();
    return `Generated ${PERF_TEST_COUNT.toLocaleString()} ids in ${elapsed}ms`;
  }
</script>

<div class="mt-3 flex w-full flex-row items-center">
  <span class="flex pr-3">
    <button
      {disabled}
      aria-label="Run performance test"
      title="Run performance test"
      onclick={() => onclick()}
      class="
			group flex h-8 w-8 content-center items-center justify-center rounded-full shadow-md shadow-gray-400
			{disabled
        ? 'cursor-not-allowed disabled:bg-gray-600'
        : 'cursor-pointer bg-indigo-500 transition-all hover:bg-purple-600 active:translate-y-[1px] active:bg-purple-700'}"
    >
      <RunIcon class={disabled ? 'text-gray-300' : 'text-indigo-50 active:text-white'} />
    </button>
  </span>

  <Output {disabled}>
    {typeof output === 'number' ? formatResult(output) : '< Run performance test'}
  </Output>
</div>
