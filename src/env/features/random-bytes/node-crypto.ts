/**
 * @module nexid/env/features/random-bytes/node-crypto
 *
 * Node.js crypto implementation of secure random bytes generation.
 *
 * ARCHITECTURE:
 * This module provides an implementation of the RandomBytes feature using
 * the Node.js crypto module's randomBytes() function. This is the recommended
 * approach for generating cryptographically secure random values in Node.js
 * environments, providing high-quality entropy from the operating system.
 *
 * SECURITY:
 * - Uses Node.js's cryptographically secure random number generator
 * - Draws entropy directly from the operating system's secure source
 * - Suitable for cryptographic applications and secure ID generation
 */

import { FeatureSet } from 'nexid/env/registry';
import crypto from 'node:crypto';

/**
 * Generates cryptographically secure random bytes using Node.js crypto.
 *
 * @param size - Number of random bytes to generate
 * @returns Uint8Array containing the requested number of random bytes
 */
export const randomBytes: FeatureSet['RandomBytes'] = (size: number) => {
  const buffer = crypto.randomBytes(size);
  return new Uint8Array(buffer);
};
