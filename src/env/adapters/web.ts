import { hash as subtleCryptoHash } from '../lib/hash-function/subtle-crypto';
import { getFingerprint } from '../lib/machine-id/web-fingerprint';
import { getProcessId } from '../lib/process-id/web';
import { randomBytes as webCryptoRandomBytes } from '../lib/random-bytes/web-crypto';
import { Environment, EnvironmentAdapter } from '../registry';

export const WebAdapter = new Environment({
  RandomBytes: webCryptoRandomBytes,
  HashFunction: subtleCryptoHash,
  MachineId: getFingerprint,
  ProcessId: getProcessId,
} as EnvironmentAdapter);
