import { RAW_LEN } from './constants';
import { encode } from './encoding';
import { XIDBytes } from './xid';

/**
 * Converts an XID to its 20-character string representation using base32-hex encoding.
 *
 * @param id - The XID to convert to string
 * @returns A 20-character string representation of the ID
 */
export function toString(id: XIDBytes): string {
  return encode(id);
}

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
export function compare(a: XIDBytes, b: XIDBytes): number {
  return compareBytes(a, b);
}

/**
 * Checks if two XIDs are equal.
 * Two XIDs are equal if they contain the same bytes in the same order.
 *
 * @param a - First XID to compare
 * @param b - Second XID to compare
 * @returns True if the XIDs contain identical bytes, false otherwise
 */
export function equals(a: XIDBytes, b: XIDBytes): boolean {
  if (a === b) return true;

  // Compare all bytes
  for (let i = 0; i < RAW_LEN; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if an XID is a nil (zero) ID.
 * A nil ID has all bytes set to zero and is typically used as a placeholder or default value.
 *
 * @param id - The XID to check
 * @returns True if this is a nil ID, false otherwise
 */
export function isNil(id: XIDBytes): boolean {
  for (let i = 0; i < RAW_LEN; i++) {
    if (id[i] !== 0) {
      return false;
    }
  }

  return true;
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
export function sortIds(ids: readonly XIDBytes[]): XIDBytes[] {
  return [...ids].sort(compare);
}

// ============================================================================
// Main export
// ============================================================================

export const helpers = { compareBytes, compare, equals, isNil, sortIds };
