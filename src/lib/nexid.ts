import { compareBytes, encode, RAW_LEN } from './encoding';

// ============================================================================
// Base class
// ============================================================================

/**
 * XID object representing a 12-byte globally unique identifier
 */
export class ID {
  private readonly bytes: Uint8Array;

  /**
   * Create a new ID from raw bytes
   * @param bytes Optional raw bytes (creates a zero ID if omitted)
   */
  constructor(bytes?: Uint8Array) {
    if (bytes && bytes.length === RAW_LEN) {
      // Make a copy to prevent external modification
      this.bytes = new Uint8Array(bytes);
    } else if (!bytes) {
      // Create a nil ID if no bytes provided
      this.bytes = new Uint8Array(RAW_LEN);
    } else {
      throw new Error(`ID must be exactly ${RAW_LEN} bytes`);
    }
  }

  /**
   * Get the timestamp portion of this ID
   */
  getTime(): Date {
    // First 4 bytes contain Unix timestamp (seconds since epoch)
    const seconds =
      (this.bytes[0] << 24) | (this.bytes[1] << 16) | (this.bytes[2] << 8) | this.bytes[3];
    return new Date(seconds * 1000);
  }

  /**
   * Get the 3-byte machine identifier from this ID
   */
  getMachineId(): Uint8Array {
    return this.bytes.slice(4, 7);
  }

  /**
   * Get the 2-byte process ID from this ID
   */
  getProcessId(): number {
    return (this.bytes[7] << 8) | this.bytes[8];
  }

  /**
   * Get the 3-byte counter value from this ID
   */
  getCounter(): number {
    return (this.bytes[9] << 16) | (this.bytes[10] << 8) | this.bytes[11];
  }

  /**
   * Get the raw bytes of this ID
   */
  toBytes(): Uint8Array {
    // Return a copy to prevent modification
    return new Uint8Array(this.bytes);
  }

  /**
   * Convert this ID to its string representation
   */
  toString(): string {
    return encode(this.bytes);
  }

  /**
   * Custom JSON serialization
   */
  toJSON(): string {
    return this.toString();
  }

  /**
   * Compare this ID with another lexicographically
   * Since timestamp is the first component, this also sorts chronologically
   * @returns Negative if this < other, 0 if equal, positive if this > other
   */
  compare(other: ID): number {
    return compareBytes(this.bytes, other.bytes);
  }

  /**
   * Check if this ID equals another
   */
  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof ID)) return false;

    // Compare all bytes
    for (let i = 0; i < RAW_LEN; i++) {
      if (this.bytes[i] !== other.bytes[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if this is a nil (zero) ID
   */
  isNil(): boolean {
    for (let i = 0; i < RAW_LEN; i++) {
      if (this.bytes[i] !== 0) {
        return false;
      }
    }
    return true;
  }
}
