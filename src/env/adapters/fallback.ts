/**
 * NeXID Environment - Fallback Adapter Implementation
 *
 * This module provides last-resort implementations of the environment adapter
 * that work across all JavaScript environments. The fallback adapter is used when:
 *
 * 1. Environment-specific adapters are unavailable
 * 2. Specific methods in environment adapters fail
 * 3. The environment cannot be reliably detected
 *
 * The fallback implementations prioritize maximum compatibility over
 * optimal security or performance. They use basic JavaScript features
 * available in virtually all environments to ensure the library can
 * still function, albeit with some compromises.
 *
 * Security Note: Several methods in this adapter use non-cryptographically secure
 * approaches. These are clearly marked and only used as a last resort.
 *
 * @module nexid/env/adapters/fallback
 */

import { Result } from 'nexid/types/result';
import { EnvironmentAdapter } from './base';

// ============================================================================
// Fallback Adapter Implementation
// ============================================================================

/**
 * Fallback adapter that provides basic functionality across all environments.
 * Used when environment-specific adapters are unavailable or their methods fail.
 */
export class FallbackAdapter implements EnvironmentAdapter {
  /**
   * Fallback random source that uses Math.random().
   * WARNING: This is NOT cryptographically secure and should only be used
   * when no secure alternatives are available.
   *
   * @param size - Number of random bytes to generate
   * @returns Uint8Array of pseudo-random values
   */
  public randomBytes(size: number): Uint8Array {
    console.warn('Using non-secure fallback (randomBytes)');

    const byteArray = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      byteArray[i] = Math.floor(Math.random() * 256);
    }
    return byteArray;
  }

  /**
   * Simple fallback hash function when Web Crypto API is unavailable.
   * Uses FNV-1a (Fowler–Noll–Vo) hash algorithm which is fast and has
   * good distribution properties. While not cryptographically secure,
   * it's sufficient for generating machine IDs.
   *
   * SECURITY NOTE: This hash function is NOT cryptographically secure
   * and should not be used for any security-critical purposes.
   *
   * @param data String to hash.
   * @returns 3-byte hash as Uint8Array.
   */
  public async hash(data: string | Uint8Array): Promise<Uint8Array> {
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
  }

  /**
   * Generates a random machine ID when no hardware identifiers are available.
   * This ID will be different each time the application runs, which isn't ideal,
   * but ensures the library can still function.
   *
   * @returns A Promise that resolves to a Result containing a generated machine ID
   */
  public async getMachineId(): Promise<Result<string>> {
    const bytes = this.randomBytes(3);
    return Result.Ok(`${bytes[0] << 8}-${bytes[1] << 8}-${bytes[2] << 8}`);
  }

  /**
   * Generates a random process ID when process information is unavailable.
   * This ensures IDs can still be generated with some level of uniqueness.
   *
   * @returns A Promise that resolves to a Result containing a generated process ID
   */
  public async getProcessId(): Promise<Result<number>> {
    const bytes = this.randomBytes(2);
    return Result.Ok((bytes[0] << 8) | bytes[1]);
  }
}
