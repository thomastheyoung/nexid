/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare var self: ServiceWorkerGlobalScope;
export {};

import type { XIDGenerator } from 'nexid';
import NeXID from 'nexid/web';
import { Logger } from '../../lib/logger';
import type { PayloadFor } from '../index';
import type { ClientToWorkerMessage, WorkerToClientMessage } from './types';

// ============================================================================
// Setup instance variables & functions
// ============================================================================

let nexid: XIDGenerator;

const logger = Logger('orange', 'SW:Worker');

async function initNeXID() {
  try {
    nexid = await NeXID.init();
    logger.log('XID generator initialized');
  } catch (error) {
    console.error('Failed to initialize XID generator', error);
    return false;
  }
  return true;
}

function Messenger(client: Client | ServiceWorker) {
  return function sendMessage<T extends WorkerToClientMessage, K extends T['type']>(
    type: K,
    payload?: PayloadFor<T, K>
  ) {
    client.postMessage({ type, payload });
  };
}

// ============================================================================
// Setup service worker on install
// -------------------------------
// 1. Skip waiting to activate the service worker immediately
// 2. Initialize generator during installation
// ============================================================================

self.addEventListener('install', (event: ExtendableEvent) => {
  logger.log('Installing...');
  self.skipWaiting();
  event.waitUntil(initNeXID());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  logger.log('Activating...');
  event.waitUntil(self.clients.claim());
  logger.log('Activated');
});

// ============================================================================
// Handle messages
// ============================================================================

self.addEventListener('message', async (event: ExtendableMessageEvent) => {
  const client = event.source;
  if (!client) throw new Error('Unknown sender');

  const sendMessage = Messenger(client as Client);

  if (!nexid) {
    const initialized = await initNeXID();
    if (!initialized) {
      sendMessage('error', { message: 'Unable to initialize NeXID generator' });
      return;
    }
  }

  try {
    const msg: ClientToWorkerMessage = event.data as ClientToWorkerMessage;

    switch (msg.type) {
      case 'new-xid':
        {
          sendMessage('result:xid', { xid: nexid.fastId() });
        }
        return;

      case 'new-batch':
        {
          const start = performance.now();
          const xids: string[] = new Array(msg.payload.size).map(nexid.fastId);
          const end = performance.now();
          const time = end - start;
          sendMessage('result:batch', { xids, time });
        }
        return;
    }
  } catch (error) {
    const message = `Error processing message '${event.data}'`;
    console.error(message, error);
    sendMessage('error', { message });
  }
});

logger.log(`Script loaded (${self.serviceWorker.scriptURL})`);
