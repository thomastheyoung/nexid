/**
 * @module nexid/env/lib/hash-function
 * 
 * Cryptographic hash function feature definition and fallback implementation.
 * 
 * ARCHITECTURE:
 * This module defines the interface and validation for the HashFunction feature,
 * which provides a secure way to hash identifiers before using them in XIDs.
 * Hashing machine IDs and other inputs helps protect sensitive information
 * while still maintaining uniqueness.
 * 
 * The hash function should ideally be cryptographically secure whenever possible:
 * - Node.js uses the crypto module's SHA-256 implementation
 * - Browsers use the SubtleCrypto API's SHA-256 implementation
 * - Fallback uses a simple but sufficient non-cryptographic hash function
 * 
 * SECURITY:
 * - All platform-specific implementations should use SHA-256 when available
 * - The fallback implementation (FNV-1a) is only used when secure APIs aren't available
 * - Appropriate warnings are displayed when falling back to less secure alternatives
 */

import { FeatureDefinition } from 'nexid/env/registry';

/**
 * Definition of the HashFunction feature including validation and fallback.
 */
export const HashFunctionDefinition: FeatureDefinition<'HashFunction'> = {
  /**
   * Tests if the provided implementation is a valid HashFunction function.
   * 
   * @param impl - The implementation to test
   * @returns Promise resolving to true if the implementation is valid
   */
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = await impl('custom-hash-test');
      return result instanceof Uint8Array && result.length === 32;
    } catch {
      return false;
    }
  },

  /**
   * Simple fallback hash function when cryptographic APIs are unavailable.
   * Uses FNV-1a (Fowler–Noll–Vo) hash algorithm which is fast and has
   * good distribution properties. While not cryptographically secure,
   * it's sufficient for generating machine IDs.
   *
   * SECURITY NOTE: This hash function is NOT cryptographically secure
   * and should only be used when no secure alternatives are available.
   *
   * @param data - String or byte array to hash
   * @returns A 32-byte hash as a Uint8Array
   */
  async fallback(data: string | Uint8Array): Promise<Uint8Array> {
    console.warn('Using non-secure fallback (hash)');

    // Convert input to string
    const str = typeof data === 'string' ? data : data.toString();

    // FNV prime: 16777619 (0x01000193)
    // FNV offset basis: 2166136261 (0x811c9dc5)
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0; // multiply by FNV prime and ensure 32-bit unsigned
    }

    // Create a result buffer filled with variations of the hash
    const byteArray = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      byteArray[i] = ((h ^ (i * 0x53)) + i) & 0xff;
    }

    return byteArray;
  },
};
