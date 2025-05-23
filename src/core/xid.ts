/**
 * @module nexid/core/xid
 *
 * Core XID immutable value type and operations.
 *
 * ARCHITECTURE:
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
 * - Immutability: all XID values and operations are immutable
 * - Functional composition: pure operations on value objects
 * - Type safety: comprehensive type definitions with exhaustive checks
 *
 * SECURITY:
 * - Copy-on-read for component extraction to prevent tampering
 * - Strict validation for all inputs
 * - No mutation methods provided on XID instances
 */

import { ENCODED_LEN, RAW_LEN } from 'nexid/common/constants';
import { XIDBytes } from 'nexid/types/xid';
import { decode, encode } from './encoding';
import { compareBytes } from './helpers';

/**
 * Immutable XID class representing a globally unique identifier.
 *
 * An XID is a 12-byte value with a specific structure that ensures
 * both uniqueness and lexicographical sortability. XIDs can be
 * serialized to a compact 20-character URL-safe string representation.
 */
export class XID {
  /**
   * Private constructor to ensure XIDs are only created through factory methods.
   * This enforces proper validation of all XID instances.
   *
   * @param bytes - The underlying byte array for the XID
   * @private
   */
  private constructor(public readonly bytes: XIDBytes) {}

  // ============================================================================
  // Static class methods
  // ============================================================================

  /**
   * Creates an XID from a raw byte array.
   *
   * @param bytes - The 12-byte array to create the ID from
   * @returns A new XID instance
   * @throws Error if the input is not a valid 12-byte Uint8Array
   */
  public static fromBytes(bytes: Uint8Array): XID {
    if (!(bytes instanceof Uint8Array)) {
      throw new Error('ID is not a Uint8Array');
    }
    if (bytes.length !== RAW_LEN) {
      throw new Error('Invalid id length');
    }
    return new XID(bytes as XIDBytes);
  }

  /**
   * Parses an XID from its 20-character string representation.
   *
   * @param str - The string to parse (expected to be 20 characters in base32-hex format)
   * @returns A new XID instance
   * @throws Error if the input string is invalid or malformed
   */
  public static fromString(str: string): XID {
    if (str.length !== ENCODED_LEN) {
      throw new Error('Invalid id length');
    }
    if (!/[0-9a-v]{20}/.test(str)) {
      throw new Error('Invalid string id (must be 20 chars, 0-9 a-v');
    }
    return new XID(decode(str) as XIDBytes);
  }

  /**
   * Creates a nil (zero) XID, useful as a default value or placeholder.
   *
   * @returns A nil XID (all bytes set to zero)
   */
  public static nilID(): XID {
    return new XID(new Uint8Array(RAW_LEN) as XIDBytes);
  }

  // ============================================================================
  // Component getters
  // ============================================================================

  /**
   * Extracts the timestamp portion of the XID as a JavaScript Date object.
   *
   * @returns A Date object representing when the ID was created
   */
  get time(): Date {
    const id = this.bytes;
    // First 4 bytes contain Unix timestamp (seconds since epoch)
    const seconds = (id[0] << 24) | (id[1] << 16) | (id[2] << 8) | id[3];
    return new Date(seconds * 1000);
  }

  /**
   * Extracts the machine identifier component from the XID.
   * This is a 3-byte value derived from platform-specific identifiers.
   *
   * @returns A copy of the 3-byte machine ID portion
   */
  get machineId(): Uint8Array {
    return this.bytes.slice(4, 7);
  }

  /**
   * Extracts the process ID component from the XID.
   * This is a 2-byte value of the process that generated the ID.
   *
   * @returns A number representing the process ID
   */
  get processId(): number {
    const id = this.bytes;
    return (id[7] << 8) | id[8];
  }

  /**
   * Extracts the counter component from the XID.
   * This is a 3-byte value that increments for each ID generated by the same
   * process, ensuring uniqueness even when multiple IDs are generated in the same second.
   *
   * @returns A number representing the counter value
   */
  get counter(): number {
    const id = this.bytes;
    return (id[9] << 16) | (id[10] << 8) | id[11];
  }

  // ============================================================================
  // Instance methods
  // ============================================================================

  /**
   * Converts the XID to its 20-character base32-hex string representation.
   * This string is URL-safe, compact, and maintains lexicographical ordering.
   *
   * @returns A 20-character string representation of the XID
   */
  toString(): string {
    return encode(this.bytes);
  }

  /**
   * Checks if this XID is a nil (zero) ID.
   * A nil ID has all bytes set to zero and is typically used as a placeholder or default value.
   *
   * @returns True if this is a nil ID, false otherwise
   */
  isNil(): boolean {
    return this.bytes.every((byte) => byte === 0);
  }

  /**
   * Checks if this XID is equal to another XID.
   * Two XIDs are equal if they contain the same bytes in the same order.
   *
   * @param other - Second XID to compare
   * @returns True if the XIDs contain identical bytes, false otherwise
   */
  equals(other: XID): boolean {
    if (this === other) return true;
    return this.bytes.every((byte, i) => byte === other.bytes[i]);
  }

  /**
   * Compares the current XID with another, lexicographically.
   * Since the timestamp is the first component, this also sorts chronologically.
   *
   * @param other - Second XID to compare
   * @returns Negative number if a is smaller (older), 0 if equal, positive if a is greater (newer)
   */
  compare(other: XID): number {
    return compareBytes(this.bytes, other.bytes);
  }
}
