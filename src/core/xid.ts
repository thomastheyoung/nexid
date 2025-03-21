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
 * - Type safety: Comprehensive type definitions with exhaustive checks
 */

import { ENCODED_LEN, RAW_LEN } from './constants';
import { decode, encode } from './encoding';
import { helpers } from './helpers';

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
// Definitions
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
export type XIDBytes = Readonly<Uint8Array> & { readonly __xid: unique symbol };

// ============================================================================
// Factory Functions
// ============================================================================

export class XID {
  private constructor(public readonly bytes: XIDBytes) {}

  // ============================================================================
  // Factory static methods
  // ============================================================================

  /**
   * Creates an XID from a raw byte array.
   *
   * @param bytes - The 12-byte array to create the ID from
   * @returns A Result containing either the new XID or an error message
   */
  public static fromBytes(bytes: Uint8Array) {
    if (bytes.length !== RAW_LEN) {
      throw new InvalidXIDError('Invalid id length');
    }
    return new XID(bytes as XIDBytes);
  }

  /**
   * Parses an XID from its 20-character string representation.
   *
   * @param idString - The string to parse (expected to be 20 characters in base32-hex format)
   * @returns A Result containing either the parsed XID or an error message
   */
  public static fromString(str: string) {
    if (str.length !== ENCODED_LEN) {
      throw new InvalidXIDError('Invalid id length');
    }
    return new XID(decode(str) as XIDBytes);
  }

  /**
   * Creates a nil (zero) XID, useful as a default value or placeholder.
   *
   * @returns A nil XID (all bytes set to zero)
   */
  public static nilXID(): XID {
    return new XID(new Uint8Array(RAW_LEN) as XIDBytes);
  }

  // ============================================================================
  // Instance methods
  // ============================================================================

  toString(): string {
    return encode(this.bytes);
  }

  isNil(): boolean {
    return helpers.isNil(this.bytes);
  }

  /**
   * Extracts the timestamp portion of an XID as a JavaScript Date object.
   *
   * @param id - The XID to extract the timestamp from
   * @returns A Date object representing when the ID was created
   */
  get time(): Date {
    const id = this.bytes;
    // First 4 bytes contain Unix timestamp (seconds since epoch)
    const seconds = (id[0] << 24) | (id[1] << 16) | (id[2] << 8) | id[3];
    return new Date(seconds * 1000);
  }

  /**
   * Extracts the machine identifier component from an XID.
   * This is a 3-byte value derived from platform-specific identifiers.
   *
   * @param id - The XID to extract the machine ID from
   * @returns A copy of the 3-byte machine ID portion
   */
  get machineId(): Uint8Array {
    return this.bytes.slice(4, 7);
  }

  /**
   * Extracts the process ID component from an XID.
   * This is a 2-byte value representing the process that generated the ID.
   *
   * @param id - The XID to extract the process ID from
   * @returns A number representing the process ID
   */
  get processId(): number {
    const id = this.bytes;
    return (id[7] << 8) | id[8];
  }

  /**
   * Extracts the counter component from an XID.
   * This is a 3-byte value that increments for each ID generated by the same
   * process, ensuring uniqueness even when multiple IDs are generated in the same second.
   *
   * @param id - The XID to extract the counter from
   * @returns A number representing the counter value
   */
  get counter(): number {
    const id = this.bytes;
    return (id[9] << 16) | (id[10] << 8) | id[11];
  }
}
