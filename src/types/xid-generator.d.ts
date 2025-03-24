import { RandomBytesProvider } from './capability';
import { XID } from './xid';

export namespace Generator {
  export interface API {
    readonly machineId: string;
    readonly processId: number;
    newId(): XID;
    fastId(): string;
  }

  export type Options = Partial<{
    randomBytes: RandomBytesProvider;
    machineId: string;
    processId: number;
  }>;
}
