<script lang="ts">
  import GenBatchAction from '$lib/components/actions/gen-batch.svelte';
  import GenXIDAction from '$lib/components/actions/gen-xid.svelte';
  import { PERF_TEST_COUNT } from '$lib/performance-test';
  import { onMount } from 'svelte';
  import CircleXIcon from '~icons/fa6-solid/circle-xmark';
  import type { PayloadFor } from '../index';
  import type { ClientToWorkerMessage, WorkerToClientMessage } from './types';

  // ==========================================================================
  // Props
  // ==========================================================================

  interface Props {
    clientId: string;
    port: MessagePort;
    ondelete: (clientId: string) => void;
  }
  let { clientId, port, ondelete }: Props = $props();

  // ==========================================================================
  // State
  // ==========================================================================

  let xidResult: string = $state() as string;
  let batchResult: number = $state() as number;

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  onMount(async () => {
    port.onmessage = (ev: MessageEvent<WorkerToClientMessage>) => {
      if (!ev.data || !ev.data.type || !ev.data.dest) return;
      if (ev.data.dest !== 'client') return;
      if (typeof ev.data.type !== 'string') return;

      const { type, payload } = ev.data;
      switch (type) {
        case 'result:xid':
          {
            xidResult = payload.xid;
          }
          return;

        case 'result:batch':
          {
            batchResult = payload.time;
          }
          return;
      }
    };
  });

  // ==========================================================================
  // Actions
  // ==========================================================================

  function sendMessage<T extends ClientToWorkerMessage, K extends T['type']>(
    type: K,
    payload?: PayloadFor<T, K>
  ) {
    port.postMessage({ dest: 'worker', type, payload });
  }

  function newXID() {
    sendMessage('new-xid');
  }

  function newBatch() {
    sendMessage('new-batch', { size: PERF_TEST_COUNT });
  }
</script>

<div
  class="flex basis-[50%] flex-col rounded-md border-[1px] border-stone-300 bg-stone-300/40 px-4 py-3"
>
  <div class="flex flex-row justify-between">
    <!--  -->
    <h2 class="text-md text-slate-700">
      <span class="mr-1">Client ID:</span><strong>{clientId}</strong>
    </h2>
    <button
      aria-label="Remove client"
      title="Remove client"
      class="cursor-pointer"
      onclick={() => ondelete(clientId)}
    >
      <CircleXIcon
        class="h-5 w-5 text-orange-600 transition-all hover:text-red-600 active:text-red-800"
        style="filter: drop-shadow(0 0 10px rgba(255,255,255, .5))"
      />
    </button>
  </div>

  <!-- Generate new XID -->
  <GenXIDAction onclick={() => newXID()} output={xidResult} />

  <!-- Run perf test -->
  <GenBatchAction onclick={() => newBatch()} output={batchResult} />
</div>
