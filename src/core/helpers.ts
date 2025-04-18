/**
 * @module nexid/core/helpers
 *
 * XID utility functions for common operations.
 *
 * ARCHITECTURE:
 * This module provides helper functions that operate on XID objects
 * but don't belong in the core XID class implementation. These are
 * typically higher-level operations, comparison functions, and utility
 * methods that enhance the usability of the library.
 */

import { XID } from './xid';

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Compares two byte arrays lexicographically.
 *
 * This comparison function enables XIDs to be naturally sortable in databases
 * and binary searches. Since the timestamp is the first component in the ID,
 * lexicographical sorting also results in chronological sorting.
 *
 * The comparison algorithm works by:
 * 1. Comparing each byte pair in sequence
 * 2. Returning the difference when a non-matching pair is found
 * 3. If all shared bytes match, comparing the lengths
 *
 * @param a - First byte array to compare
 * @param b - Second byte array to compare
 * @returns Negative if a < b, 0 if a === b, positive if a > b
 */
export function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length);

  // Compare bytes one by one
  for (let i = 0; i < length; i++) {
    const diff = a[i] - b[i];
    if (diff !== 0) {
      return diff;
    }
  }

  // If one is a prefix of the other, the shorter one comes first
  return a.length - b.length;
}

/**
 * Compares two XIDs lexicographically.
 * Since the timestamp is the first component, this also sorts chronologically.
 *
 * @param a - First XID to compare
 * @param b - Second XID to compare
 * @returns Negative number if a is smaller (older), 0 if equal, positive if a is greater (newer)
 */
export function compare(a: XID, b: XID): number {
  return compareBytes(a.bytes, b.bytes);
}

/**
 * Checks if two XIDs are equal.
 * Two XIDs are equal if they contain the same bytes in the same order.
 *
 * @param a - First XID to compare
 * @param b - Second XID to compare
 * @returns True if the XIDs contain identical bytes, false otherwise
 */
export function equals(a: XID, b: XID): boolean {
  if (a === b) return true;
  return a.bytes.every((byte, i) => byte === b.bytes[i]);
}

/**
 * Checks if an XID is a nil (zero) ID.
 * A nil ID has all bytes set to zero and is typically used as a placeholder or default value.
 *
 * @param id - The XID to check
 * @returns True if this is a nil ID, false otherwise
 */
export function isNil(id: XID): boolean {
  return id.bytes.every((byte) => byte === 0);
}

// ============================================================================
// Sorting Functions
// ============================================================================

/**
 * Sorts an array of XIDs in ascending chronological order.
 *
 * @param ids - Array of XIDs to sort
 * @returns A new array containing the sorted XIDs
 */
export function sortIds(ids: readonly XID[]): XID[] {
  return [...ids].sort(compare);
}

// ============================================================================
// Main export
// ============================================================================

/**
 * Collection of XID utility functions.
 */
export const helpers = { compareBytes, compare, equals, isNil, sortIds };
