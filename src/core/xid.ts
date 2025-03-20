/**
 * @module nexid/core/xid
 */

import { Result } from '../types/result';
import { compareBytes, decode, encode, RAW_LEN } from './encoding';

// ============================================================================
// Opaque Type Definition
// ============================================================================

/**
 * XID opaque type representing a globally unique, lexicographically sortable ID.
 *
 * This type provides:
 * 1. Nominal typing (cannot pass arbitrary Uint8Arrays as XIDs)
 * 2. Array-like indexed access for performance
 * 3. Runtime immutability guarantees
 *
 * @remarks
 * XIDs should never be modified after creation. A copy-on-read strategy
 * protects against modification of internal data, but direct array indexing
 * is still provided for performance in read operations.
 */
export type XID = Readonly<Uint8Array> & { readonly __xid: unique symbol };

// ============================================================================
// Error Types
// ============================================================================

export class InvalidXIDError extends Error {
  constructor(message: string) {
    super(`[NeXID] ${message}`);
    this.name = 'InvalidXIDError';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a new XID from raw bytes with validation.
 *
 * @param bytes - Raw 12-byte array for the ID. If omitted, creates a nil (zero) ID.
 * @returns A Result containing either the new XID or an error
 */
export function createXID(bytes?: Uint8Array | null): Result<XID> {
  try {
    if (bytes && bytes.length !== RAW_LEN) {
      return Result.Err(new InvalidXIDError(`ID must be exactly ${RAW_LEN} bytes`));
    }

    // Always create a defensive copy to maintain isolation
    const copy = bytes ? new Uint8Array(bytes) : new Uint8Array(RAW_LEN);

    // We can't truly freeze the array, but we use TypeScript's readonly
    // to prevent accidental modification at compile time
    return Result.Ok(copy as XID);
  } catch (error) {
    return Result.Err(error instanceof Error ? error : new InvalidXIDError(String(error)));
  }
}

/**
 * Creates an XID from a raw byte array, returning a Result.
 *
 * @param bytes - The 12-byte array to create the ID from
 * @returns A Result containing either the new XID or an error message
 */
export function fromBytes(bytes: Uint8Array): Result<XID> {
  try {
    return createXID(bytes);
  } catch (error) {
    return Result.Err(error instanceof Error ? error : new InvalidXIDError(String(error)));
  }
}

/**
 * Parses an XID from its 20-character string representation.
 *
 * @param idString - The string to parse (expected to be 20 characters in base32-hex format)
 * @returns A Result containing either the parsed XID or an error message
 */
export function fromString(idString: string): Result<XID> {
  try {
    const bytes = decode(idString);
    return createXID(bytes);
  } catch (error) {
    return Result.Err(error instanceof Error ? error : new InvalidXIDError(String(error)));
  }
}

/**
 * Creates a nil (zero) XID, useful as a default value or placeholder.
 *
 * @returns A nil XID (all bytes set to zero)
 */
export function nilXID(): XID {
  return createXID().unwrapOr(new Uint8Array(RAW_LEN) as XID);
}

// ============================================================================
// XID Component Extractors
// ============================================================================

/**
 * Extracts the timestamp portion of an XID as a JavaScript Date object.
 *
 * @param id - The XID to extract the timestamp from
 * @returns A Date object representing when the ID was created
 */
export function getTime(id: XID): Date {
  // First 4 bytes contain Unix timestamp (seconds since epoch)
  const seconds = (id[0] << 24) | (id[1] << 16) | (id[2] << 8) | id[3];
  return new Date(seconds * 1000);
}

/**
 * Extracts the machine identifier component from an XID.
 *
 * @param id - The XID to extract the machine ID from
 * @returns A copy of the 3-byte machine ID portion
 */
export function getMachineId(id: XID): Uint8Array {
  // Return a copy to maintain immutability boundary
  return id.slice(4, 7);
}

/**
 * Extracts the process ID component from an XID.
 *
 * @param id - The XID to extract the process ID from
 * @returns A number representing the process ID
 */
export function getProcessId(id: XID): number {
  return (id[7] << 8) | id[8];
}

/**
 * Extracts the counter component from an XID.
 *
 * @param id - The XID to extract the counter from
 * @returns A number representing the counter value
 */
export function getCounter(id: XID): number {
  return (id[9] << 16) | (id[10] << 8) | id[11];
}

// ============================================================================
// Direct Access Methods
// ============================================================================

/**
 * Converts an XID to its 20-character string representation using base32-hex encoding.
 *
 * @param id - The XID to convert to string
 * @returns A 20-character string representation of the ID
 */
export function toString(id: XID): string {
  return encode(id);
}

/**
 * Returns a copy of the raw bytes of the XID.
 *
 * @param id - The XID to get bytes from
 * @returns A new Uint8Array containing a copy of the bytes
 */
export function toBytes(id: XID): Uint8Array {
  // Return a copy to maintain immutability boundary
  return new Uint8Array(id);
}

// Rest of implementation follows...

/**
 * Serializes an XID to a JSON-compatible string representation.
 *
 * @param id - The XID to serialize
 * @returns The string representation of the ID
 */
export function toJSON(id: XID): string {
  return toString(id);
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Compares two XIDs lexicographically.
 * Since the timestamp is the first component, this also sorts chronologically.
 *
 * @param a - First XID to compare
 * @param b - Second XID to compare
 * @returns Negative number if a is smaller (older), 0 if equal, positive if a is greater (newer)
 */
export function compare(a: XID, b: XID): number {
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
export function equals(a: XID, b: XID): boolean {
  if (a === b) return true;

  // Compare all bytes
  return a.every((byte, i) => byte === b[i]);
}

/**
 * Checks if an XID is a nil (zero) ID.
 * A nil ID has all bytes set to zero and is typically used as a placeholder or default value.
 *
 * @param id - The XID to check
 * @returns True if this is a nil ID, false otherwise
 */
export function isNil(id: XID): boolean {
  return id.every((byte) => byte === 0);
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
export function sort(ids: readonly XID[]): XID[] {
  return [...ids].sort(compare);
}

// ============================================================================
// Function Namespace
// ============================================================================

/**
 * Namespace containing all XID operations for consistent importing.
 *
 * This enables a clean API where all functions can be imported from a single namespace:
 * ```typescript
 * import { xid } from 'nexid';
 *
 * const id = xid.fromString('cbva8hrpns70000ubl70').unwrap();
 * console.log(xid.toString(id));
 * ```
 */
export const xid = {
  create: createXID,
  fromBytes,
  fromString,
  nil: nilXID,
  getTime,
  getMachineId,
  getProcessId,
  getCounter,
  toString,
  toJSON,
  compare,
  equals,
  isNil,
  sort,
};
