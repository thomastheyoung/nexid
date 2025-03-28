/**
 * @module nexid/index-node
 *
 * NeXID Node.js-specific entry point.
 *
 * ARCHITECTURE:
 * This module provides a Node.js-optimized entry point for the NeXID library,
 * pre-configured with the NodeAdapter for server environments. This allows
 * for more efficient bundling in Node.js applications by avoiding the dynamic
 * environment detection process.
 *
 * When imported directly, this module uses the NodeAdapter without having
 * to detect the environment, providing a small performance benefit during
 * initialization and allowing for more aggressive tree-shaking of browser-specific
 * code in bundlers.
 */

import { hash as cryptoHash } from 'nexid/env/lib/hash-function/node-crypto';
import { getOSMachineId } from 'nexid/env/lib/machine-id/server-os';
import { getProcessId as getNodePID } from 'nexid/env/lib/process-id/node-pid';
import { randomBytes as cryptoRandomBytes } from 'nexid/env/lib/random-bytes/node-crypto';
import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { Environment, EnvironmentAdapter } from './env/registry';
import { initNeXID } from './types/api';
import { Generator } from './types/xid-generator';

const NodeAdapter = new Environment({
  RandomBytes: cryptoRandomBytes,
  HashFunction: cryptoHash,
  MachineId: getOSMachineId,
  ProcessId: getNodePID,
} as EnvironmentAdapter);

/**
 * Creates an XID generator with Node.js-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  return XIDGenerator(NodeAdapter, options);
}

export { XID };
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
