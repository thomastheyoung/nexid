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

import crypto from 'node:crypto';

import { XID } from 'nexid/core/xid';
import { XIDGenerator, type HashFn } from 'nexid/core/xid-generator';
import { Environment, type EnvironmentAdapter } from 'nexid/env/environment';
import { getOSMachineId } from 'nexid/env/features/machine-id/os-host-id';
import { getProcessId as getNodePID } from 'nexid/env/features/process-id/node-pid';
import { randomBytes as cryptoRandomBytes } from 'nexid/env/features/random-bytes/node-crypto';
import { type initNeXID } from 'nexid/types/api';
import { type Generator } from 'nexid/types/xid-generator';

const nodeHash: HashFn = (data: string | Uint8Array): Uint8Array =>
  new Uint8Array(crypto.createHash('sha256').update(data).digest());

const nodeAdapterConfig = {
  RandomBytes: cryptoRandomBytes,
  MachineId: getOSMachineId,
  ProcessId: getNodePID,
} satisfies EnvironmentAdapter;

/**
 * Creates an XID generator with Node.js-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns A fully configured XID generator
 */
function createXIDGenerator(options?: Generator.Options): Generator.API {
  const env = new Environment(nodeAdapterConfig, { allowInsecure: options?.allowInsecure });
  return XIDGenerator(env, nodeHash, options);
}

export { XID };
export { defaultWordFilter, createWordFilter, BLOCKED_WORDS } from './core/word-filter.js';
export type { WordFilterFn } from './core/word-filter.js';
export type { XIDBytes, XIDString } from 'nexid/types/xid';
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
