/**
 * @module nexid/env/features/random-bytes
 *
 * Random bytes feature definition and fallback implementation.
 *
 * ARCHITECTURE:
 * This module defines the interface and validation for the RandomBytes feature,
 * which is responsible for generating cryptographically secure random values.
 * The feature is critical for the security of generated IDs, as it provides
 * the unpredictable component that prevents ID collisions and guessing.
 *
 * SECURITY:
 * - Defines test function to validate that implementations produce proper output
 * - Provides a non-secure fallback using Math.random() with appropriate warnings
 * - Platform-specific implementations should use the best available source of entropy
 */

import { FeatureDefinition } from 'nexid/env/registry';

/**
 * Definition of the RandomBytes feature including validation and fallback.
 */
export const RandomBytesDefinition: FeatureDefinition<'RandomBytes'> = {
  /**
   * Tests if the provided implementation is a valid RandomBytes function.
   *
   * @param impl - The implementation to test
   * @returns Promise resolving to true if the implementation is valid
   */
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = impl(5);
      return result instanceof Uint8Array && result.length === 5;
    } catch {
      return false;
    }
  },

  /**
   * Fallback random source that uses Math.random().
   * WARNING: This is NOT cryptographically secure and should only be used
   * when no secure alternatives are available.
   *
   * @param size - Number of random bytes to generate
   * @returns Uint8Array of pseudo-random values
   */
  fallback(size: number): Uint8Array {
    console.warn('Using non-secure fallback (randomBytes)');

    const byteArray = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      byteArray[i] = Math.floor(Math.random() * 256);
    }
    return byteArray;
  },
};
