/**
 * @module nexid/core/encoding
 *
 * NeXID Core - Encoding and Decoding Implementation
 *
 * ARCHITECTURE:
 * This module provides highly optimized encoding and decoding functions for XID values,
 * converting between binary representation and string format. It uses a modified
 * base32-hex encoding that is URL-safe, case-insensitive, and maintains lexicographical
 * sorting properties across all platforms.
 *
 * The encoding process transforms the 12-byte binary ID into a 20-character string,
 * where each character represents 5 bits of data (with the final character using
 * only 4 bits).
 *
 * PERFORMANCE:
 * - Pre-computed lookup tables for both encoding and decoding
 * - Direct byte access and bit manipulation for minimal overhead
 * - Single-operation string construction
 * - Optimized error handling with early validation
 * - Manually unrolled loops for maximum throughput
 */

import { ENCODED_LEN, ENCODING, RAW_LEN } from 'nexid/common/constants';
import { XIDBytes } from 'nexid/types/xid';

// ============================================================================
// Constants
// ============================================================================

/**
 * Pre-computed array of character codes for the encoding alphabet.
 * This optimizes encoding by avoiding repeated character code lookups.
 */
const ENCODING_CHARS: Uint8Array = new Uint8Array(Array.from(ENCODING).map((c) => c.charCodeAt(0)));

/**
 * Lookup table for decoding base32-hex characters to their 5-bit values.
 *
 * This table maps ASCII character codes to their corresponding 5-bit values
 * in the base32-hex encoding. Invalid characters are marked with 0xff.
 * This pre-computation significantly improves decoding performance by
 * eliminating character lookups during the critical path.
 */
const DECODING_TABLE: Uint8Array = (() => {
  // Create a table covering the ASCII range (0-122)
  // Pre-fill with invalid character marker (0xff)
  const table = new Uint8Array(123).fill(0xff);

  // Populate the table with valid character mappings
  for (let i = 0; i < ENCODING.length; i++) {
    table[ENCODING.charCodeAt(i)] = i;
  }

  return table;
})();

// Reuse a number array for character codes instead of string array
const ENCODING_DEST = new Array<number>(ENCODED_LEN);

// ============================================================================
// Encoding Functions
// ============================================================================

/**
 * Encodes a 12-byte ID to a 20-character base32-hex string.
 *
 * This is a highly-optimized implementation that:
 * 1. Pre-caches character codes from the encoding alphabet
 * 2. Directly accesses byte values to avoid array lookups
 * 3. Builds the final string in a single operation from character codes
 *
 * @param id - Raw 12-byte ID to encode
 * @returns A 20-character base32-hex encoded string
 */
export function encode(id: XIDBytes): string {
  const charCodes = ENCODING_DEST;

  // Access bytes directly for performance optimization
  const b0 = id[0],
    b1 = id[1],
    b2 = id[2],
    b3 = id[3],
    b4 = id[4],
    b5 = id[5],
    b6 = id[6],
    b7 = id[7],
    b8 = id[8],
    b9 = id[9],
    b10 = id[10],
    b11 = id[11];

  // Reverse order filling to keep bit significance (highest to lowest-order).
  // Preserves sort order: newer IDs (with a higher timestamp) will compare greater lexicographically
  charCodes[19] = ENCODING_CHARS[(b11 << 4) & 0x1f];
  charCodes[18] = ENCODING_CHARS[(b11 >> 1) & 0x1f];
  charCodes[17] = ENCODING_CHARS[((b11 >> 6) | (b10 << 2)) & 0x1f];
  charCodes[16] = ENCODING_CHARS[(b10 >> 3) & 0x1f];
  charCodes[15] = ENCODING_CHARS[b9 & 0x1f];
  charCodes[14] = ENCODING_CHARS[((b9 >> 5) | (b8 << 3)) & 0x1f];
  charCodes[13] = ENCODING_CHARS[(b8 >> 2) & 0x1f];
  charCodes[12] = ENCODING_CHARS[((b8 >> 7) | (b7 << 1)) & 0x1f];
  charCodes[11] = ENCODING_CHARS[((b7 >> 4) | (b6 << 4)) & 0x1f];
  charCodes[10] = ENCODING_CHARS[(b6 >> 1) & 0x1f];
  charCodes[9] = ENCODING_CHARS[((b6 >> 6) | (b5 << 2)) & 0x1f];
  charCodes[8] = ENCODING_CHARS[(b5 >> 3) & 0x1f];
  charCodes[7] = ENCODING_CHARS[b4 & 0x1f];
  charCodes[6] = ENCODING_CHARS[((b4 >> 5) | (b3 << 3)) & 0x1f];
  charCodes[5] = ENCODING_CHARS[(b3 >> 2) & 0x1f];
  charCodes[4] = ENCODING_CHARS[((b3 >> 7) | (b2 << 1)) & 0x1f];
  charCodes[3] = ENCODING_CHARS[((b2 >> 4) | (b1 << 4)) & 0x1f];
  charCodes[2] = ENCODING_CHARS[(b1 >> 1) & 0x1f];
  charCodes[1] = ENCODING_CHARS[((b1 >> 6) | (b0 << 2)) & 0x1f];
  charCodes[0] = ENCODING_CHARS[(b0 >> 3) & 0x1f];

  // Convert character codes to string all at once.
  // This is more efficient than building the string character by character
  return String.fromCharCode.apply(null, charCodes);
}

/**
 * Decodes a 20-character base32-hex string to a 12-byte ID.
 *
 * The decoding process maps each character from the base32-hex alphabet
 * back to its 5-bit value, then reassembles these values into the original
 * 12-byte binary format.
 *
 * @param str - The 20-character string to decode
 * @returns The decoded 12-byte buffer
 * @throws Error if the input string is invalid (wrong length or invalid characters)
 */
export function decode(str: string): Uint8Array {
  // Validate input length
  if (!str || str.length !== ENCODED_LEN) {
    throw new Error(`Invalid XID length: expected ${ENCODED_LEN}, got ${str?.length || 0}`);
  }

  // Prepare output buffer
  const id = new Uint8Array(RAW_LEN);

  // Fast path with direct character code access (unrolled loop)
  // Optimize by pre-fetching all character codes at once
  const charCodes = new Uint8Array(ENCODED_LEN);
  for (let i = 0; i < ENCODED_LEN; i++) {
    charCodes[i] = str.charCodeAt(i);
  }

  // Use a try-catch for efficient bounds checking
  try {
    // Get decoded values directly (using a typed array for better performance)
    const decodedValues = new Uint8Array(ENCODED_LEN);
    for (let i = 0; i < ENCODED_LEN; i++) {
      const charCode = charCodes[i];
      const value = DECODING_TABLE[charCode];

      // Fast check for invalid characters
      if (value === 0xff) {
        throw new Error(`Invalid character '${str[i]}' at position ${i}`);
      }

      decodedValues[i] = value;
    }

    // Unpack 5-bit values to bytes (manually unrolled for performance)
    // Group by output byte for better readability
    id[0] = (decodedValues[0] << 3) | (decodedValues[1] >> 2);
    id[1] = (decodedValues[1] << 6) | (decodedValues[2] << 1) | (decodedValues[3] >> 4);
    id[2] = (decodedValues[3] << 4) | (decodedValues[4] >> 1);
    id[3] = (decodedValues[4] << 7) | (decodedValues[5] << 2) | (decodedValues[6] >> 3);
    id[4] = (decodedValues[6] << 5) | decodedValues[7];
    id[5] = (decodedValues[8] << 3) | (decodedValues[9] >> 2);
    id[6] = (decodedValues[9] << 6) | (decodedValues[10] << 1) | (decodedValues[11] >> 4);
    id[7] = (decodedValues[11] << 4) | (decodedValues[12] >> 1);
    id[8] = (decodedValues[12] << 7) | (decodedValues[13] << 2) | (decodedValues[14] >> 3);
    id[9] = (decodedValues[14] << 5) | decodedValues[15];
    id[10] = (decodedValues[16] << 3) | (decodedValues[17] >> 2);
    id[11] = (decodedValues[17] << 6) | (decodedValues[18] << 1) | (decodedValues[19] >> 4);

    // Consistency check (verifies that encoding/decoding round trips properly)
    if (ENCODING[(id[11] << 4) & 0x1f] !== str[19]) {
      throw new Error('XID consistency check failed');
    }

    return id;
  } catch (e) {
    if (e instanceof Error && e.message.includes('Invalid character')) {
      throw e; // Rethrow specific validation errors
    }

    // Handle out-of-bounds errors with more useful information
    if (e instanceof Error && e.message.includes('out of range')) {
      // Find which character caused the issue
      for (let i = 0; i < ENCODED_LEN; i++) {
        const charCode = charCodes[i];
        if (charCode >= DECODING_TABLE.length || DECODING_TABLE[charCode] === 0xff) {
          throw new Error(`Invalid character '${str[i]}' (code ${charCode}) at position ${i}`);
        }
      }
    }

    // Otherwise, wrap the original error
    throw new Error(`XID decoding error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
