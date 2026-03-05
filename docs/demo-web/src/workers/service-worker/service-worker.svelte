<script lang="ts">
  import { dev } from '$app/environment';
  import GenBatchAction from '$lib/components/actions/gen-batch.svelte';
  import GenXIDAction from '$lib/components/actions/gen-xid.svelte';
  import Card from '$lib/components/card/card.svelte';
  import CTA from '$lib/components/card/cta.svelte';
  import { Logger } from '$lib/logger';
  import { PERF_TEST_COUNT } from '$lib/performance-test';
  import { onMount } from 'svelte';
  import type { PayloadFor } from '../index';
  import type { ClientToWorkerMessage, WorkerToClientMessage } from './types';

  // ==========================================================================
  // State
  // ==========================================================================

  type PageState = {
    ready: boolean;
    worker: ServiceWorker | null;
    registration: ServiceWorkerRegistration | null;
    error: string | null;
  };
  let pageState: PageState = $state({
    ready: false,
    worker: null,
    registration: null,
    error: null
  });

  type UIState = {
    xid: string | null;
    batch: number | null;
  };
  let uiState: UIState = $state({
    xid: null,
    batch: null
  });

  // ==========================================================================
  // Local variables
  // ==========================================================================

  const WORKER_URL = dev
    ? `./src/workers/service-worker/service-worker.ts`
    : '/nexid/service-worker.js';
  const logger = Logger('lime', 'SW:Client');

  function Messenger(sw?: ServiceWorker | null) {
    function sendMessage<T extends ClientToWorkerMessage, K extends T['type']>(
      type: K,
      payload?: PayloadFor<T, K>
    ) {
      if (!sw) return;
      sw.postMessage({ type, payload });
    }
    return { sendMessage };
  }

  // ==========================================================================
  // Service lifecycle
  // ==========================================================================

  onMount(async () => {
    navigator.serviceWorker.addEventListener('message', onMessage as EventListener);

    try {
      const registration = await navigator.serviceWorker.getRegistration(WORKER_URL);
      if (registration) {
        waitForActivation(registration).then((worker) => {
          pageState.registration = registration;
          pageState.worker = worker;
          pageState.ready = true;
        });
      }
    } catch (error) {
      pageState.error = `Error trying to fetch an existing service worker registration (${error})`;
    }
  });

  function onMessage(e: MessageEvent<WorkerToClientMessage>) {
    const { data } = e;
    if (typeof data?.type !== 'string') return;

    switch (data.type) {
      case 'result:xid':
        {
          uiState.xid = data.payload.xid;
        }
        return;

      case 'result:batch':
        {
          uiState.batch = data.payload.time;
        }
        return;
    }
  }

  function waitForActivation(reg: ServiceWorkerRegistration) {
    return new Promise<ServiceWorker>((resolve, reject) => {
      // Service worker should be in any of these states
      const sw: ServiceWorker | null = reg.installing || reg.waiting || reg.active;
      if (!sw) return reject(`Invalid service worker state (${sw})`);

      // If the worker is active (== ready to receive messages), resolve immediately
      if (sw.state === 'activated') {
        resolve(sw);
      } else {
        // Otherwise, wait for the state to become activated
        sw.addEventListener('statechange', function onStateChange() {
          if (sw.state === 'activated') {
            resolve(sw);
            sw.removeEventListener('statechange', onStateChange);
          }
        });
      }
    });
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  async function registerWorker() {
    const cacheBuster = Math.random().toString(16).slice(2, 8);
    const url = dev ? `${WORKER_URL}?p=${cacheBuster}` : WORKER_URL;

    try {
      const registration = await navigator.serviceWorker.register(url, {
        type: dev ? 'module' : 'classic'
      });
      if (!registration) throw new Error('Unable to install service worker');

      waitForActivation(registration).then((worker) => {
        pageState.registration = registration;
        pageState.worker = worker;
        pageState.ready = true;
      });
    } catch (error) {
      pageState.error = `Error while trying to install the service worker at url ${url} (${error})`;
    }
  }

  async function unregisterWorker() {
    if (pageState.registration) {
      const res = await pageState.registration.unregister();
      if (res) {
        logger.log('Worker unregistered successfully');
        pageState = { ready: false, registration: null, worker: null, error: null };
      }
    }
  }

  function newXID() {
    Messenger(pageState.worker).sendMessage('new-xid');
  }

  function newBatch() {
    Messenger(pageState.worker).sendMessage('new-batch', { size: PERF_TEST_COUNT });
  }
</script>

<Card
  title={'Service worker'}
  description={`Generate XIDs using a background service worker (persists after page close):`}
>
  <div class="flex flex-row items-center justify-between">
    {#if pageState.ready}
      <p class="all-small-caps text-lg font-semibold text-lime-600">Worker active!</p>
      <CTA variant={'lime'} onclick={() => unregisterWorker()}>Unregister worker</CTA>
    {:else}
      <p class="all-small-caps text-lg font-semibold text-sky-700">No worker registered yet</p>
      <CTA variant={'blue'} onclick={() => registerWorker()}>Register worker</CTA>
    {/if}
  </div>

  <!-- Generate new XID -->
  <GenXIDAction onclick={() => newXID()} disabled={!pageState.ready} output={uiState.xid} />

  <!-- Run perf test -->
  <GenBatchAction onclick={() => newBatch()} disabled={!pageState.ready} output={uiState.batch} />
</Card>
