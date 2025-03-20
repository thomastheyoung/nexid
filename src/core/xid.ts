/**
 * @module nexid/core/xid
 *
 * Core XID immutable value type and operations.
 *
 * This module provides the fundamental XID implementation - globally unique,
 * lexicographically sortable identifiers with a rich functional API. Each XID
 * consists of 12 bytes (96 bits) with the following structure:
 *
 *   ╔═══════════════════════════════════════════════════════════════╗
 *   ║0             3║4             6║7             8║9            11║
 *   ║--- 4 bytes ---║--- 3 bytes ---║--- 2 bytes ---║--- 3 bytes ---║
 *   ║═══════════════════════════════════════════════════════════════║
 *   ║     time      ║   machine ID  ║   process ID  ║    counter    ║
 *   ╚═══════════════════════════════════════════════════════════════╝
 *
 * DESIGN PRINCIPLES:
 * - Immutability: All XID values and operations are immutable
 * - Functional composition: Pure operations on value objects
 * - Zero-cost abstractions: Optimized for minimal overhead
 * - Type safety: Comprehensive type definitions with exhaustive checks
 */

import { Result } from '../types/result';
import { compareBytes, decode, encode, RAW_LEN } from './encoding';
import { createXIDBytes, XIDBytes } from './xid-bytes';

// ============================================================================
// Constants
// ============================================================================

/** 16-bit mask for process ID */
export const PROCESS_ID_MASK = 0xffff;

/** 8-bit mask for byte operations */
export const BYTE_MASK = 0xff;

// ============================================================================
// Custom Error Types
// ============================================================================

/**
 * Error thrown when an invalid XID is provided or constructed.
 */
export class InvalidXIDError extends Error {
  constructor(message: string) {
    super(`[NeXID] ${message}`);
    this.name = 'InvalidXIDError';
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * XID value type representing a globally unique identifier.
 *
 * This is the core data structure that holds the immutable bytes of an XID.
 * All operations on XIDs are implemented as pure functions on this type.
 */
export type XID = Readonly<{
  /**
   * Immutable byte array representing the XID.
   * Must be exactly 12 bytes.
   */
  readonly bytes: Readonly<XIDBytes>;
}>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a new XID from raw bytes.
 *
 * @param bytes - Raw 12-byte array for the ID. If omitted, creates a nil (zero) ID.
 * @returns A new XID instance
 * @throws InvalidXIDError if bytes are provided but not exactly 12 bytes long
 */
export function createXID(bytes?: Uint8Array): XID {
  if (bytes) {
    const xidb = createXIDBytes(new Uint8Array(bytes));
    if (xidb.isOk()) {
      return { bytes: xidb.unwrap() };
    }
  } else if (!bytes) {
    // Create a nil ID if no bytes provided
    return { bytes: new Uint8Array(RAW_LEN) as XIDBytes };
  }
  throw new InvalidXIDError(`ID must be exactly ${RAW_LEN} bytes`);
}

/**
 * Creates an XID from a raw byte array, returning a Result.
 *
 * @param bytes - The 12-byte array to create the ID from
 * @returns A Result containing either the new XID or an error message
 */
export function fromBytes(bytes: Uint8Array): Result<XID> {
  try {
    return Result.Ok(createXID(bytes));
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
    return Result.Ok(createXID(bytes));
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
  return createXID();
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
  const { bytes } = id;
  // First 4 bytes contain Unix timestamp (seconds since epoch)
  const seconds = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  return new Date(seconds * 1000);
}

/**
 * Extracts the machine identifier component from an XID.
 * This is a 3-byte value derived from platform-specific identifiers.
 *
 * @param id - The XID to extract the machine ID from
 * @returns A copy of the 3-byte machine ID portion
 */
export function getMachineId(id: XID): Uint8Array {
  return id.bytes.slice(4, 7);
}

/**
 * Extracts the process ID component from an XID.
 * This is a 2-byte value representing the process that generated the ID.
 *
 * @param id - The XID to extract the process ID from
 * @returns A number representing the process ID
 */
export function getProcessId(id: XID): number {
  return (id.bytes[7] << 8) | id.bytes[8];
}

/**
 * Extracts the counter component from an XID.
 * This is a 3-byte value that increments for each ID generated by the same
 * process, ensuring uniqueness even when multiple IDs are generated in the same second.
 *
 * @param id - The XID to extract the counter from
 * @returns A number representing the counter value
 */
export function getCounter(id: XID): number {
  return (id.bytes[9] << 16) | (id.bytes[10] << 8) | id.bytes[11];
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Converts an XID to its 20-character string representation using base32-hex encoding.
 *
 * @param id - The XID to convert to string
 * @returns A 20-character string representation of the ID
 */
export function toString(id: XID): string {
  return encode(id.bytes);
}

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

  const aBytes = a.bytes;
  const bBytes = b.bytes;

  // Compare all bytes
  return aBytes.every((byte, i) => byte === bBytes[i]);
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
