/**
 * @module nexid/index-deno
 *
 * NeXID Deno-specific entry point.
 *
 * ARCHITECTURE:
 * This module provides a Deno-optimized entry point for the NeXID library,
 * pre-configured with the DenoAdapter for Deno environments. This allows
 * for more efficient usage in Deno applications by avoiding the dynamic
 * environment detection process.
 *
 * When imported directly, this module uses the DenoAdapter without having
 * to detect the environment, providing a small performance benefit during
 * initialization and potentially allowing for better tree-shaking if bundled.
 */

import { XID } from 'nexid/core/xid';
import { XIDGenerator } from 'nexid/core/xid-generator';
import { Environment, type EnvironmentAdapter } from 'nexid/env/environment';
import { hash as cryptoHash } from 'nexid/env/features/hash-function/node-crypto';
import { getOSMachineId } from 'nexid/env/features/machine-id/os-hostid';
import { getProcessId as getDenoPID } from 'nexid/env/features/process-id/deno-pid';
import { randomBytes as cryptoRandomBytes } from 'nexid/env/features/random-bytes/node-crypto';
import { type initNeXID } from 'nexid/types/api';
import { type Generator } from 'nexid/types/xid-generator';

const DenoAdapter = new Environment({
  RandomBytes: cryptoRandomBytes,
  HashFunction: cryptoHash,
  MachineId: getOSMachineId,
  ProcessId: getDenoPID,
} as EnvironmentAdapter);

/**
 * Creates an XID generator with Deno-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  return XIDGenerator(DenoAdapter, options);
}

export { XID };
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
