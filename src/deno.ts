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

import crypto from 'node:crypto';

import { XID } from 'nexid/core/xid';
import { XIDGenerator, type HashFn } from 'nexid/core/xid-generator';
import { Environment, type EnvironmentAdapter } from 'nexid/env/environment';
import { getOSMachineId } from 'nexid/env/features/machine-id/os-host-id';
import { getProcessId as getDenoPID } from 'nexid/env/features/process-id/deno-pid';
import { randomBytes as cryptoRandomBytes } from 'nexid/env/features/random-bytes/node-crypto';
import { type initNeXID } from 'nexid/types/api';
import { type Generator } from 'nexid/types/xid-generator';

const denoHash: HashFn = (data: string | Uint8Array): Uint8Array =>
  new Uint8Array(crypto.createHash('sha256').update(data).digest());

const denoAdapterConfig = {
  RandomBytes: cryptoRandomBytes,
  MachineId: getOSMachineId,
  ProcessId: getDenoPID,
} satisfies EnvironmentAdapter;

/**
 * Creates an XID generator with Deno-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns A fully configured XID generator
 */
function createXIDGenerator(options?: Generator.Options): Generator.API {
  const env = new Environment(denoAdapterConfig, { allowInsecure: options?.allowInsecure });
  return XIDGenerator(env, denoHash, options);
}

export { XID };
export { BLOCKED_WORDS } from './core/offensive-word-filter.js';
export type { XIDBytes, XIDString } from 'nexid/types/xid';
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
