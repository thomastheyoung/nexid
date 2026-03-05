<script lang="ts">
  import GenBatchAction from '$lib/components/actions/gen-batch.svelte';
  import GenXIDAction from '$lib/components/actions/gen-xid.svelte';
  import Card from '$lib/components/card/card.svelte';
  import { runPerformanceTest } from '$lib/performance-test';
  import type { XIDGenerator } from 'nexid/web';
  import NeXID from 'nexid/web';
  import { onMount } from 'svelte';

  // ==========================================================================
  // State
  // ==========================================================================

  let ready: boolean = $state(false);
  let xidResult: string = $state() as string;
  let batchResult: number = $state() as number;

  // ==========================================================================
  // Local variables
  // ==========================================================================

  const BATCH_SIZE = 100000;
  let nexid: XIDGenerator;

  // ==========================================================================
  // Component lifecycle
  // ==========================================================================

  onMount(async () => {
    nexid = await NeXID.init();
    ready = true;
  });

  // ==========================================================================
  // Actions
  // ==========================================================================

  function generateXID() {
    xidResult = nexid.fastId();
  }

  function generateBatch() {
    const result = runPerformanceTest(nexid.fastId, BATCH_SIZE);
    batchResult = result.time;
  }
</script>

<Card title={'Main thread'} description={'Generate XIDs directly in the main browser thread:'}>
  <div class="flex flex-col">
    <!-- Generate new XID -->
    <GenXIDAction onclick={() => generateXID()} output={xidResult} />

    <!-- Run perf test -->
    <GenBatchAction onclick={() => generateBatch()} output={batchResult} />
  </div>
</Card>
