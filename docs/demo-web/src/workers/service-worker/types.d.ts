export type ClientToWorkerMessage =
  | { type: 'hello' }
  | { type: 'new-xid' }
  | { type: 'new-batch'; payload: { size: number } };

export type WorkerToClientMessage =
  | { type: 'ready' }
  | { type: 'result:xid'; payload: { xid: string } }
  | { type: 'result:batch'; payload: { xids: string[]; time: number } }
  | { type: 'error'; payload: { message: string } };

export type WorkerBroadcastMessage =
  | { type: 'result'; payload: { result: number } }
  | { type: 'error'; payload: { message: string } };
