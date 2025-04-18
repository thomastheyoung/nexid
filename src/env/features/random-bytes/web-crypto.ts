/**
 * @module nexid/env/features/random-bytes/web-crypto
 *
 * Web Crypto API implementation of secure random bytes generation.
 *
 * ARCHITECTURE:
 * This module provides an implementation of the RandomBytes feature using
 * the Web Crypto API's getRandomValues() method. This is the recommended
 * approach for generating cryptographically secure random values in browser
 * environments and is widely supported across all modern browsers.
 *
 * SECURITY:
 * - Uses the browser's cryptographically secure random number generator
 * - Suitable for cryptographic applications and secure ID generation
 * - Guaranteed to be from a high-quality entropy source
 */

import { FeatureSet } from 'nexid/env/registry';

/**
 * Generates cryptographically secure random bytes using the Web Crypto API.
 *
 * @param size - Number of random bytes to generate
 * @returns Uint8Array containing the requested number of random bytes
 */
export const randomBytes: FeatureSet['RandomBytes'] = (size: number) => {
  const bytes = new Uint8Array(size);
  return globalThis.crypto.getRandomValues(bytes);
};
