<script lang="ts">
  import Card from '$lib/components/card/card.svelte';
  import { Logger } from '$lib/logger';
  import NeXID from 'nexid/web';
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { ClientID, XID } from '../index';
  import SharedWorkerClient from './client.svelte';
  import type {
    ClientToWorkerMessage,
    WorkerBroadcastMessage,
    WorkerToClientMessage
  } from './types';

  // ==========================================================================
  // State
  // ==========================================================================

  const Global = $state({
    xids: [],
    clients: [],
    lastXidByClient: new SvelteMap()
  }) as {
    xids: Array<[XID, ClientID]>;
    clients: ClientID[];
    lastXidByClient: SvelteMap<ClientID, XID>;
  };

  const Local = $state({
    clients: new SvelteMap(),
    tabID: null
  }) as { clients: SvelteMap<string, MessagePort>; tabID: string | null };

  // ==========================================================================
  // Local variables
  // ==========================================================================

  let SharedWorkerModule: typeof import('*?sharedworker');
  const logger = Logger('teal', 'shared-worker:client');

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  onMount(async () => {
    const nexid = await NeXID.init();
    if (!window.location.hash) {
      window.location.hash = nexid.fastId();
    }
    Local.tabID = window.location.hash.replace('#', '');
    SharedWorkerModule = await import(`./shared-worker.ts?sharedworker`);
  });

  function onMessage(ev: MessageEvent<WorkerToClientMessage>) {
    const { data } = ev;
    if (typeof data?.type !== 'string') return;

    switch (data.type) {
      case 'ready': {
        Local.clients.set(data.payload.clientId, ev.target as MessagePort);
        return;
      }
    }
  }

  // ==========================================================================
  // Broadcast
  // ==========================================================================

  function onBroadcastMessage(ev: MessageEvent<WorkerBroadcastMessage>) {
    if (!ev.data || !ev.data.type || !ev.data.dest) return;
    if (typeof ev.data.type !== 'string' || ev.data.dest !== 'broadcast') return;

    const { type, payload } = ev.data;
    switch (type) {
      case 'client-added':
        {
          logger.log('Client added:', payload);
          Global.clients = payload.clients;
        }
        return;

      case 'client-removed':
        {
          logger.log('Client removed:', payload);
          Global.clients = payload.clients;
        }
        return;

      case 'result:xid':
        {
          Global.xids.push([payload.xid, payload.origin]);
          Global.lastXidByClient.set(payload.origin, payload.xid);
        }
        return;
    }
  }

  const BroadcastManager = (() => {
    let attachedPort: MessagePort | null = null;

    const setup = (port: MessagePort) => {
      if (!attachedPort) {
        attachedPort = port;
        port.addEventListener('message', onBroadcastMessage);
      }
    };

    const remove = (port: MessagePort) => {
      if (port === attachedPort) {
        port.removeEventListener('message', onBroadcastMessage);
        const nextPort: MessagePort | undefined = Local.clients.values().next().value;
        if (nextPort) {
          attachedPort = nextPort;
          nextPort.addEventListener('message', onBroadcastMessage);
        } else {
          attachedPort = null;
        }
      }
    };

    return { setup, remove };
  })();

  // ==========================================================================
  // Actions
  // ==========================================================================

  async function createWorker() {
    const worker = new SharedWorkerModule.default({ name: 'nexid:showcase-shared-worker' });
    worker.port.addEventListener('message', onMessage);
    BroadcastManager.setup(worker.port);
    worker.port.start();
    worker.port.postMessage({
      type: 'register',
      payload: { tabID: Local.tabID }
    } as ClientToWorkerMessage);
  }

  let remoteClients = $derived(
    Global.clients.filter((cid) => !Local.clients.has(cid))
  );

  function deleteWorker(clientId: ClientID) {
    const port = Local.clients.get(clientId);
    if (port) {
      port.postMessage({ type: 'unregister' } as ClientToWorkerMessage);
      Local.clients.delete(clientId);
      Global.clients = Global.clients.filter((cid) => cid !== clientId);
      BroadcastManager.remove(port);
    }
  }
</script>

<Card
  title={'Shared workers'}
  description={`This demo shows multiple clients communicating with the same shared worker instance. All clients
		share the same XID generator and can see each other's activity.`}
>
  <div class="flex flex-col gap-1">
    <div class="mb-1 flex flex-row justify-end">
      <button
        onclick={() => createWorker()}
        class="
					max-h-10 cursor-pointer place-self-center rounded-lg border-b-[4px] border-blue-600 bg-blue-500 px-6 py-2 text-sm font-semibold
					text-white transition-all
					hover:border-blue-700 hover:brightness-110 active:translate-y-[1px] active:border-b-[4px] active:brightness-90"
      >
        Add new client
      </button>
    </div>
    <div class="flex min-h-14 flex-col justify-center rounded-md bg-blue-200/70 p-3 text-sm">
      {#if Global.clients.length === 0}
        <h2 class="self-center text-sky-700">No worker registered on this tab yet :)</h2>
      {:else}
        <h2 class="all-small-caps m-0 mb-2 self-center p-0 text-xl font-bold text-sky-700">
          Global status
        </h2>
        <div class="flex flex-col">
          <div class="flex flex-row justify-between">
            <span>Current window ID: <strong>{Local.tabID}</strong></span>
            <span>Clients connected: <strong>{Global.clients.length}</strong></span>
          </div>
          <div class="flex flex-row justify-between">
            <span>Last ID generated:</span>
            <span>IDs generated: <strong>{Global.xids.length}</strong></span>
          </div>
        </div>
        <div class="mt-1 rounded-sm bg-white p-1 font-mono text-xs text-slate-600">
          {#if Global.xids.length > 0}
            {@const lastId = Global.xids.at(Global.xids.length - 1) as [string, string]}
            {`${lastId[0]} (origin: ${lastId[1]})`}
          {:else}
            {'None'}
          {/if}
        </div>
      {/if}
    </div>
    <div class="flex flex-col gap-2">
      {#each Local.clients.entries() as [clientId, port]}
        <SharedWorkerClient {clientId} {port} ondelete={deleteWorker} />
      {/each}
      {#each remoteClients as clientId}
        <div
          class="flex basis-[50%] flex-col rounded-md border-[1px] border-slate-300 bg-slate-200/40 px-4 py-3 opacity-70"
        >
          <div class="flex flex-row items-center justify-between">
            <h2 class="text-md text-slate-500">
              <span class="mr-1">Client ID:</span><strong>{clientId}</strong>
            </h2>
            <span
              class="rounded-full bg-slate-400/30 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-slate-500 uppercase"
            >
              Remote
            </span>
          </div>
          <div class="mt-2 text-xs text-slate-400">
            {#if Global.lastXidByClient.has(clientId)}
              <span class="text-slate-500">Last XID:</span>
              <span class="font-mono text-slate-600">{Global.lastXidByClient.get(clientId)}</span>
            {:else}
              <span class="italic">No activity yet</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</Card>
