/**
 * NeXID Core - Input Validation Functions
 *
 * This module provides validation functions for the components used in XID generation:
 * machine IDs, process IDs, random sources, and hash functions. Each validator ensures
 * that inputs conform to the required formats and constraints, converting them when
 * possible and returning appropriate errors when validation fails.
 *
 * These validators implement a consistent pattern using the Result type
 * to handle success and error cases in a type-safe way, making error handling
 * more explicit and predictable throughout the library.
 *
 * @module nexid/core/validators
 */

import { Adapter } from 'nexid/env/adapters/base';
import { Result } from 'nexid/types/result';

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a random bytes source function.
 * The function must accept a size parameter and return a Uint8Array of that size.
 *
 * @security Custom random sources should be cryptographically secure when
 * used in production environments to ensure adequate entropy in generated IDs.
 *
 * @param fn - The function to validate as a random source
 * @returns A Result that resolves to:
 *   - `Ok<RandomBytes>` containing the validated function when valid
 *   - `Err` with a descriptive error message when invalid
 */
export function validateRandomBytesFunction(fn: Function): Result<Adapter.RandomBytes> {
  try {
    if (fn && typeof fn === 'function') {
      // Test the function by requesting 5 random bytes
      const res = fn(5);
      if (res instanceof Uint8Array && res.length === 5) {
        return Result.Ok(fn as Adapter.RandomBytes);
      }
    }
  } catch (e) {
    /* silent fail, will return error result below */
  }

  return Result.Err(`Invalid random source function ('${fn}')`);
}

/**
 * Validates a hash function.
 * The function must accept a string or Uint8Array input and return a Uint8Array of
 * the expected hash length (typically 32 bytes for SHA-256).
 *
 * @security Custom hash functions should be cryptographically secure when used
 * for machine ID generation or other security-sensitive operations.
 *
 * @param fn - The function to validate as a hash function
 * @returns A Result that resolves to:
 *   - `Ok<Hash>` containing the validated hash function when valid
 *   - `Err` with a descriptive error message when invalid
 */
export function validateHashFunction(fn: Function): Result<Adapter.Hash> {
  try {
    if (fn && typeof fn === 'function') {
      // Test the function by hashing a test string
      const res = fn('Hash function test');
      if (res instanceof Uint8Array && res.length === 32) {
        return Result.Ok(fn as Adapter.Hash);
      }
    }
  } catch (e) {
    /* silent fail, will return error result below */
  }

  return Result.Err(`Invalid hash function ('${fn}')`);
}
