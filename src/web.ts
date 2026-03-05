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
import { XIDGenerator, type HashFn } from 'nexid/core/xid-generator';
import { Environment, type EnvironmentAdapter } from 'nexid/env/environment';
import { getWebMachineId } from 'nexid/env/features/machine-id/web-machine-id';
import { getProcessId } from 'nexid/env/features/process-id/web';
import { randomBytes as webCryptoRandomBytes } from 'nexid/env/features/random-bytes/web-crypto';
import { type initNeXID } from 'nexid/types/api';
import { type Generator } from 'nexid/types/xid-generator';

/**
 * FNV-1a hash function for browser environments where crypto.subtle
 * is async-only. Produces a 32-byte output from a 32-bit FNV-1a digest.
 * Not cryptographically secure — sufficient for machine ID differentiation
 * since only 3 bytes are extracted for the XID machine ID component.
 */
const fnv1aHash: HashFn = (data: string | Uint8Array): Uint8Array => {
  let str: string;
  if (typeof data === 'string') {
    str = data;
  } else {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i++) {
      chunks.push(String.fromCharCode(data[i]));
    }
    str = chunks.join('');
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = ((h ^ (i * 0x53)) + i) & 0xff;
  }
  return out;
};

const webAdapterConfig: EnvironmentAdapter = {
  RandomBytes: webCryptoRandomBytes,
  MachineId: getWebMachineId,
  ProcessId: getProcessId,
};

/**
 * Creates an XID generator with browser-specific optimizations.
 *
 * @param options - Optional configuration parameters
 * @returns A fully configured XID generator
 */
function createXIDGenerator(options?: Generator.Options): Generator.API {
  const env = new Environment(webAdapterConfig, { allowInsecure: options?.allowInsecure });
  return XIDGenerator(env, fnv1aHash, options);
}

export { XID };
export type { XIDBytes, XIDString } from 'nexid/types/xid';
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
