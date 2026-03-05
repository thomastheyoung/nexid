<script lang="ts">
  import GenBatchAction from '$lib/components/actions/gen-batch.svelte';
  import GenXIDAction from '$lib/components/actions/gen-xid.svelte';
  import Card from '$lib/components/card/card.svelte';
  import CTA, { type Variant } from '$lib/components/card/cta.svelte';
  import { PERF_TEST_COUNT } from '$lib/performance-test';
  import type { PayloadFor } from '../index';
  import Worker from './index?worker';
  import type { ClientToWorkerMessage, WorkerToClientMessage } from './types';

  // ==========================================================================
  // State
  // ==========================================================================

  let isWorkerReady: boolean = $state(false);
  let xidResult: string = $state() as string;
  let batchResult: number = $state() as number;

  // CTA props
  let ctaProps: { disabled: boolean; variant: Variant } = $derived({
    disabled: isWorkerReady,
    variant: isWorkerReady ? 'orange' : 'blue'
  });

  // Local variables
  let worker: Worker;

  // ==========================================================================
  // Service lifecycle
  // ==========================================================================

  function startWorker() {
    if (isWorkerReady) return;

    worker = new Worker();
    worker.onmessage = onMessage;
    sendMessage('init');
  }

  function onMessage(e: MessageEvent<WorkerToClientMessage>) {
    const { data } = e;
    if (typeof data?.type !== 'string') return;

    switch (data.type) {
      case 'ready':
        {
          isWorkerReady = true;
        }
        return;

      case 'xid-generated':
        {
          xidResult = data.payload.xid;
        }
        return;

      case 'batch-generated':
        {
          batchResult = data.payload.time;
        }
        return;
    }
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  function sendMessage<T extends ClientToWorkerMessage, K extends T['type']>(
    type: K,
    payload?: PayloadFor<T, K>
  ) {
    worker.postMessage({ type, payload });
  }

  function newXID() {
    sendMessage('new-xid');
  }

  function newBatch() {
    sendMessage('new-batch', { size: PERF_TEST_COUNT });
  }
</script>

<Card
  title={'Dedicated worker (standard web workers)'}
  description={`Generate XIDs using a dedicated web worker (one per page):`}
>
  <div class="flex flex-row items-center justify-end">
    <CTA {...ctaProps} onclick={() => startWorker()}>
      {isWorkerReady ? 'Worker started!' : 'Start dedicated worker'}
    </CTA>
  </div>

  <!-- Generate new XID -->
  <GenXIDAction onclick={() => newXID()} disabled={!isWorkerReady} output={xidResult} />

  <!-- Run perf test -->
  <GenBatchAction onclick={() => newBatch()} disabled={!isWorkerReady} output={batchResult} />
</Card>
