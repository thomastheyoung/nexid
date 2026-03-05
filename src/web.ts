/**
 * @module nexid/index-web
 *
 * NeXID Web browser-specific entry point.
 *
 * ARCHITECTURE:
 * This module provides a browser-optimized entry point for the NeXID library,
 * pre-configured with the WebAdapter for client environments. This allows
 * for more efficient bundling in browser applications by avoiding the dynamic
 * environment detection process and eliminating Node.js-specific code.
 *
 * When imported directly, this module uses the WebAdapter without having
 * to detect the environment, providing a small performance benefit during
 * initialization and allowing for more aggressive tree-shaking of server-specific
 * code in bundlers.
 */

import { XID } from 'nexid/core/xid';
import { XIDGenerator } from 'nexid/core/xid-generator';
import { Environment, type EnvironmentAdapter } from 'nexid/env/environment';
import { murmur3Hash } from 'nexid/env/features/hash/murmur3';
import { getWebMachineId } from 'nexid/env/features/machine-id/web-machine-id';
import { getProcessId } from 'nexid/env/features/process-id/web';
import { randomBytes as webCryptoRandomBytes } from 'nexid/env/features/random-bytes/web-crypto';
import { type initNeXID } from 'nexid/types/api';
import { type Generator } from 'nexid/types/xid-generator';

const webAdapterConfig = {
  RandomBytes: webCryptoRandomBytes,
  MachineId: getWebMachineId,
  ProcessId: getProcessId,
} satisfies EnvironmentAdapter;

/**
 * Creates an XID generator with browser-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns A fully configured XID generator
 */
function createXIDGenerator(options?: Generator.Options): Generator.API {
  const env = new Environment(webAdapterConfig, { allowInsecure: options?.allowInsecure });
  return XIDGenerator(env, murmur3Hash, options);
}

export { XID };
export type { XIDBytes, XIDString } from 'nexid/types/xid';
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
