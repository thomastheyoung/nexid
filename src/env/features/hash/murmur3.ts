/**
 * MurmurHash3_x86_32 — synchronous 32-bit hash for environments where
 * crypto.subtle is async-only (browsers). Returns a 32-byte buffer
 * (first 4 bytes are the hash, remaining bytes are padding) to satisfy
 * the HashFn contract designed around SHA-256. Only the first 3 bytes
 * are consumed for machine ID.
 *
 * Why MurmurHash3 over alternatives:
 * - vs FNV-1a: MurmurHash3's finalization mix (fmix32) provides near-ideal
 *   avalanche. FNV-1a has known bias in lower bits, leading to higher
 *   collision rates when extracting small byte slices.
 * - vs xxHash32: comparable quality and complexity, but MurmurHash3 is more
 *   widely referenced and its avalanche properties are better documented.
 * - vs SipHash: designed for hash-flooding resistance we don't need;
 *   more complex with no distribution benefit for this use case.
 * - vs crypto.subtle.digest: would require async initialization. MurmurHash3
 *   keeps the init path synchronous with no quality loss at 3 bytes.
 *
 * Implementation follows the canonical MurmurHash3_x86_32 algorithm:
 * 4-byte little-endian block processing with separate tail handling.
 * Seed is 0 (standard default).
 *
 * @see https://github.com/aappleby/smhasher/blob/master/src/MurmurHash3.cpp
 */

import { type HashFn } from 'nexid/core/xid-generator';

export const murmur3Hash: HashFn = (data: string | Uint8Array): Uint8Array => {
  // Normalize to bytes
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 0xff;
  } else {
    bytes = data;
  }

  const len = bytes.length;
  const nblocks = len >>> 2;
  let h = 0; // seed

  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  // Body — process 4-byte blocks
  for (let i = 0; i < nblocks; i++) {
    const off = i << 2;
    let k =
      bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
    k = Math.imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, c2);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }

  // Tail — remaining 1-3 bytes
  const tailOff = nblocks << 2;
  const tail = len & 3;
  if (tail > 0) {
    let k1 = bytes[tailOff];
    if (tail >= 2) k1 ^= bytes[tailOff + 1] << 8;
    if (tail >= 3) k1 ^= bytes[tailOff + 2] << 16;
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h ^= k1;
  }

  // Finalization (fmix32)
  h ^= len;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  h >>>= 0;

  // Pack into 32-byte buffer (HashFn contract)
  const out = new Uint8Array(32);
  out[0] = h & 0xff;
  out[1] = (h >>> 8) & 0xff;
  out[2] = (h >>> 16) & 0xff;
  out[3] = (h >>> 24) & 0xff;
  return out;
};
