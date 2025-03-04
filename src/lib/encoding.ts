// ============================================================================
// Constants
// ============================================================================

/**
 * Character set for base32 hex encoding
 * Using digits 0-9 and lowercase letters a-v
 */
export const ENCODING = '0123456789abcdefghijklmnopqrstuv';

/** Length of encoded ID string */
export const ENCODED_LEN = 20;

/** Length of raw binary ID in bytes */
export const RAW_LEN = 12;

// ============================================================================
// Encoding utilities
// ============================================================================

/**
 * Encode a 12-byte ID to a 20-character base32 hex string
 * @param id Raw 12-byte ID to encode
 * @throws Error if the ID is not exactly 12 bytes
 */
export function encode(id: Uint8Array): string {
  if (id.length !== RAW_LEN) {
    throw new Error(`ID must be exactly ${RAW_LEN} bytes`);
  }

  // Pre-allocate result array
  const result = new Array<string>(ENCODED_LEN);

  // Access bytes directly for better compatibility
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

  // Encode each 5-bit chunk
  result[0] = ENCODING[b0 >> 3];
  result[1] = ENCODING[((b0 << 2) & 0x1f) | (b1 >> 6)];
  result[2] = ENCODING[(b1 >> 1) & 0x1f];
  result[3] = ENCODING[((b1 << 4) & 0x1f) | (b2 >> 4)];
  result[4] = ENCODING[((b2 << 1) & 0x1f) | (b3 >> 7)];
  result[5] = ENCODING[(b3 >> 2) & 0x1f];
  result[6] = ENCODING[((b3 << 3) & 0x1f) | (b4 >> 5)];
  result[7] = ENCODING[b4 & 0x1f];
  result[8] = ENCODING[b5 >> 3];
  result[9] = ENCODING[((b5 << 2) & 0x1f) | (b6 >> 6)];
  result[10] = ENCODING[(b6 >> 1) & 0x1f];
  result[11] = ENCODING[((b6 << 4) & 0x1f) | (b7 >> 4)];
  result[12] = ENCODING[((b7 << 1) & 0x1f) | (b8 >> 7)];
  result[13] = ENCODING[(b8 >> 2) & 0x1f];
  result[14] = ENCODING[((b8 << 3) & 0x1f) | (b9 >> 5)];
  result[15] = ENCODING[b9 & 0x1f];
  result[16] = ENCODING[b10 >> 3];
  result[17] = ENCODING[((b10 << 2) & 0x1f) | (b11 >> 6)];
  result[18] = ENCODING[(b11 >> 1) & 0x1f];
  result[19] = ENCODING[(b11 << 4) & 0x1f];

  return result.join('');
}

/**
 * Decode a 20-character base32 hex string to a 12-byte ID
 * @param str String to decode
 * @returns Decoded 12-byte buffer or null if invalid
 */
export function decode(str: string): Uint8Array | null {
  // Validate length
  if (!str || str.length !== ENCODED_LEN) {
    return null;
  }

  // Create decoding table on first use
  const decodingTable = new Uint8Array(123); // ASCII range
  decodingTable.fill(0xff); // Invalid character marker

  // Populate decoding table with valid characters
  for (let i = 0; i < ENCODING.length; i++) {
    decodingTable[ENCODING.charCodeAt(i)] = i;
  }

  // Decode each character to its 5-bit value
  const c = new Uint8Array(ENCODED_LEN);
  for (let i = 0; i < ENCODED_LEN; i++) {
    const charCode = str.charCodeAt(i);

    // Check for invalid characters
    if (charCode >= decodingTable.length || decodingTable[charCode] === 0xff) {
      return null;
    }

    c[i] = decodingTable[charCode];
  }

  // Allocate output buffer
  const id = new Uint8Array(RAW_LEN);

  // Unpack 5-bit values to bytes
  id[0] = (c[0] << 3) | (c[1] >> 2);
  id[1] = (c[1] << 6) | (c[2] << 1) | (c[3] >> 4);
  id[2] = (c[3] << 4) | (c[4] >> 1);
  id[3] = (c[4] << 7) | (c[5] << 2) | (c[6] >> 3);
  id[4] = (c[6] << 5) | c[7];
  id[5] = (c[8] << 3) | (c[9] >> 2);
  id[6] = (c[9] << 6) | (c[10] << 1) | (c[11] >> 4);
  id[7] = (c[11] << 4) | (c[12] >> 1);
  id[8] = (c[12] << 7) | (c[13] << 2) | (c[14] >> 3);
  id[9] = (c[14] << 5) | c[15];
  id[10] = (c[16] << 3) | (c[17] >> 2);
  id[11] = (c[17] << 6) | (c[18] << 1) | (c[19] >> 4);

  // Validate decoding with a consistency check
  if (ENCODING[(id[11] << 4) & 0x1f] !== str[19]) {
    return null;
  }

  return id;
}

/**
 * Compare two byte arrays lexicographically
 * This makes IDs naturally sortable in databases and binary searches
 */
export function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length);

  for (let i = 0; i < length; i++) {
    const diff = a[i] - b[i];
    if (diff !== 0) {
      return diff;
    }
  }

  // If one is a prefix of the other, the shorter one comes first
  return a.length - b.length;
}
