/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare var self: DedicatedWorkerGlobalScope;
export {};

import { Logger } from '$lib/logger';
import type { XIDGenerator } from 'nexid';
import NeXID from 'nexid/web';
import type { PayloadFor } from '../index';
import type { ClientToWorkerMessage, WorkerToClientMessage } from './types';

// ============================================================================
// Setup instance variables & functions
// ============================================================================

const logger = Logger('cyan', 'dedicated-worker');
let nexid: XIDGenerator;

async function initNeXID() {
  try {
    nexid = await NeXID.init();
    logger.log('XID generator initialized');
  } catch (error) {
    logger.error('Failed to initialize XID generator', error);
    return false;
  }
  return true;
}

function sendMessage<T extends WorkerToClientMessage, K extends T['type']>(
  type: K,
  payload?: PayloadFor<T, K>
) {
  self.postMessage({ type, payload });
}

// ============================================================================
// Handle messages
// ============================================================================

self.addEventListener('message', async (event: MessageEvent) => {
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
      case 'init':
        {
          sendMessage('ready');
        }
        return;

      case 'new-xid':
        {
          sendMessage('xid-generated', { xid: nexid.fastId() });
        }
        return;

      case 'new-batch':
        {
          const start = performance.now();
          const xids: string[] = new Array(msg.payload.size).map(nexid.fastId);
          const end = performance.now();
          const time = end - start;
          sendMessage('batch-generated', { xids, time });
        }
        return;
    }
  } catch (error) {
    const message = `Error processing message '${event.data}'`;
    logger.error(message, error);
    sendMessage('error', { message });
  }
});
