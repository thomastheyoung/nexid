export type ClientID = string;

export type ClientToWorkerMessage =
  | { type: 'init' }
  | { type: 'new-xid' }
  | { type: 'new-batch'; payload: { size: number } };

export type WorkerToClientMessage =
  | { type: 'ready'; payload: { clientId: ClientID } }
  | { type: 'xid-generated'; payload: { xid: string } }
  | { type: 'batch-generated'; payload: { xids: string[]; time: number } }
  | { type: 'error'; payload: { message: string } };

export type WorkerBroadcastMessage =
  | { type: 'result'; payload: { result: number } }
  | { type: 'error'; payload: { message: string } };
