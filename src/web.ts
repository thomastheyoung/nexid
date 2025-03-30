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

import { hash as subtleCryptoHash } from 'nexid/env/lib/hash-function/subtle-crypto';
import { getFingerprint } from 'nexid/env/lib/machine-id/web-fingerprint';
import { getProcessId } from 'nexid/env/lib/process-id/web';
import { randomBytes as webCryptoRandomBytes } from 'nexid/env/lib/random-bytes/web-crypto';
import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { Environment, EnvironmentAdapter } from './env/registry';
import { initNeXID } from './types/api';
import { Generator } from './types/xid-generator';

const WebAdapter = new Environment({
  RandomBytes: webCryptoRandomBytes,
  HashFunction: subtleCryptoHash,
  MachineId: getFingerprint,
  ProcessId: getProcessId,
} as EnvironmentAdapter);

/**
 * Creates an XID generator with browser-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  console.log('NeXID: initializing with Web adapter');
  return XIDGenerator(WebAdapter, options);
}

export { XID };
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
