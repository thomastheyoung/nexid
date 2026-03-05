export type Source = 'client' | 'worker';
export type Destination = 'client' | 'worker' | 'broadcast';

type ClientMessage =
  | { type: 'register'; payload: { tabID: string } }
  | { type: 'unregister' }
  | { type: 'new-xid' }
  | { type: 'new-batch'; payload: { size: number } };

export type ClientToWorkerMessage = ClientMessage & { src: 'client'; dest: 'worker' };

type WorkerMessage =
  | { type: 'ready'; payload: { clientId: ClientID } }
  | { type: 'result:xid'; payload: { xid: string } }
  | { type: 'result:batch'; payload: { xids: string[]; time: number } }
  | { type: 'error'; payload: { message: string } };

export type WorkerToClientMessage = WorkerMessage & { src: 'client'; dest: 'client' };

type BroadcastMessage =
  | { type: 'client-added'; payload: { clientId: ClientID; tabID: string; clients: string[] } }
  | { type: 'client-removed'; payload: { clientId: ClientID; tabID: string; clients: string[] } }
  | { type: 'result:xid'; payload: { origin: ClientID; xid: string } }
  | { type: 'result:batch'; payload: { origin: ClientID; result: number } }
  | { type: 'error'; payload: { origin: ClientID; message: string } };

export type WorkerBroadcastMessage = BroadcastMessage & { src: 'worker'; dest: 'broadcast' };
