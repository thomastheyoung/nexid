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

import { XID } from 'nexid/core/xid';
import { XIDGenerator } from 'nexid/core/xid-generator';
import { Environment, type EnvironmentAdapter } from 'nexid/env/environment';
import { hash as cryptoHash } from 'nexid/env/features/hash-function/node-crypto';
import { getOSMachineId } from 'nexid/env/features/machine-id/os-hostid';
import { getProcessId as getNodePID } from 'nexid/env/features/process-id/node-pid';
import { randomBytes as cryptoRandomBytes } from 'nexid/env/features/random-bytes/node-crypto';
import { type initNeXID } from 'nexid/types/api';
import { type Generator } from 'nexid/types/xid-generator';

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
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
