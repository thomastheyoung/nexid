import { hash as cryptoHash } from '../lib/hash-function/node-crypto';
import { getOSMachineId } from '../lib/machine-id/server-os';
import { getProcessId } from '../lib/process-id/node-pid';
import { randomBytes as cryptoRandomBytes } from '../lib/random-bytes/node-crypto';
import { Environment, EnvironmentAdapter } from '../registry';

export const NodeAdapter = new Environment({
  RandomBytes: cryptoRandomBytes,
  HashFunction: cryptoHash,
  MachineId: getOSMachineId,
  ProcessId: getProcessId,
} as EnvironmentAdapter);
