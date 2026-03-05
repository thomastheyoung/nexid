/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare var self: SharedWorkerGlobalScope;
export {};

// ============================================================================
// Inspect workers: {chrome,brave}://inspect/#workers
// ============================================================================

import { Logger } from '$lib/logger';
import { Heroes } from '$lib/names';
import type { XIDGenerator } from 'nexid';
import NeXID from 'nexid/web';
import type { PayloadFor } from '../index';
import type { ClientToWorkerMessage, WorkerBroadcastMessage, WorkerToClientMessage } from './types';

type ClientID = string;

// ============================================================================
// Setup instance variables
// ============================================================================

const clients = new Map<ClientID, MessagePort>();
let port: MessagePort;
let nexid: XIDGenerator;

const randomID = () => {
  return `#${clients.size + 1}:${Math.random().toString(16).substring(3, 9)}`;
};

const logger = Logger('fuchsia', 'shared-worker');

function getRandomHero() {
  let i = Heroes.length * Heroes.length;
  while (true && i-- > 0) {
    const rand = (Heroes.length * Math.random()) | 0;
    const key = [Heroes[rand][0], Heroes[rand][1]]
      .join('-')
      .toLowerCase()
      .replaceAll(/[[:punct:]\s]/g, '');
    if (!clients.has(key)) {
      return key;
    }
  }
  return Math.random().toString(16).substring(3, 9);
}

// ============================================================================
// Setup shared worker on connect
// ------------------------------
// We make sure the onconnect function is  the first thing we define, as this
// needs to be consumed in priority to connect the worker successfully
// ============================================================================

self.onconnect = async (e: MessageEvent) => {
  nexid ??= await NeXID.init();

  const clientId = getRandomHero();
  logger.log(`New client connected: ${clientId}`);

  port = e.ports[0];
  port.onmessage = MessageHandler(clientId, port);
  port.start();

  clients.set(clientId, port);
};

self.onerror = (e: ErrorEvent) => {
  logger.error(`Error:`, e);
};

// ============================================================================
// Message handlers
// ============================================================================

const MessageHandler = (clientId: ClientID, port: MessagePort) => {
  const sendMessage = Messenger(port);
  let tabID: string = '//Empty';

  return async (e: MessageEvent<ClientToWorkerMessage>) => {
    logger.log(`Message received:`, e.data);

    const msg = e.data;
    if (typeof msg.type !== 'string') {
      throw new Error(`Invalid message:`, msg);
    }

    switch (msg.type) {
      case 'register':
        {
          tabID = msg.payload.tabID;
          sendMessage('ready', { clientId });
          broadcast('client-added', { clientId, tabID, clients: clients.keys().toArray() });
        }
        return;

      case 'unregister':
        {
          port.close();
          clients.delete(clientId);
          broadcast('client-removed', { clientId, tabID, clients: clients.keys().toArray() });
        }
        return;

      case 'new-xid':
        {
          const xid = nexid.fastId();
          sendMessage('result:xid', { xid });
          broadcast('result:xid', { origin: clientId, xid });
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

      default:
        console.warn(`Unsupported message type: ${msg}`);
    }
  };
};

// ============================================================================
// Outbound messaging utils
// ============================================================================

function Messenger(port: MessagePort) {
  return function sendMessage<T extends WorkerToClientMessage, K extends T['type']>(
    type: K,
    payload?: PayloadFor<T, K>
  ) {
    port.postMessage({ dest: 'client', type, payload });
  };
}

function broadcast<T extends WorkerBroadcastMessage, K extends T['type']>(
  type: K,
  payload?: PayloadFor<T, K>
) {
  for (const port of clients.values()) {
    port.postMessage({ dest: 'broadcast', type, payload });
  }
}
