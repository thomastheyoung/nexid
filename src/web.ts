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
 * MurmurHash3-32 for browser environments where crypto.subtle is async-only.
 * Produces a 32-byte output from a 32-bit digest. Not cryptographically secure,
 * but sufficient for machine ID differentiation since only 3 bytes are extracted
 * for the XID machine ID component.
 *
 * Why MurmurHash3 over alternatives:
 * - vs FNV-1a: MurmurHash3's finalization mix gives near-ideal avalanche
 *   (~50% of output bits flip per input bit change). FNV-1a has known bias,
 *   especially in its lower bits, leading to worse collision rates.
 * - vs xxHash: comparable quality but more complex to implement (requires
 *   64-bit arithmetic or lane-based mixing), not worth it for 3 bytes.
 * - vs SipHash: designed for hash-flooding resistance which we don't need;
 *   more complex with no distribution benefit for this use case.
 * - vs crypto.subtle.digest: would require async initialization. MurmurHash3
 *   keeps the init path synchronous with no measurable quality loss at 3 bytes.
 */
const murmur3Hash: HashFn = (data: string | Uint8Array): Uint8Array => {
  let str: string;
  if (typeof data === 'string') {
    str = data;
  } else {
    let s = '';
    for (let i = 0; i < data.length; i++) s += String.fromCharCode(data[i]);
    str = s;
  }

  let h = 0x971e137b;
  for (let i = 0; i < str.length; i++) {
    let k = str.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
  }

  // Finalization mix — ensures full avalanche
  h ^= str.length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  h >>>= 0;

  const out = new Uint8Array(32);
  out[0] = h & 0xff;
  out[1] = (h >>> 8) & 0xff;
  out[2] = (h >>> 16) & 0xff;
  out[3] = (h >>> 24) & 0xff;
  for (let i = 4; i < 32; i++) {
    out[i] = ((h ^ (i * 0x53)) + i) & 0xff;
  }
  return out;
};

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
