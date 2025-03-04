/**
 * Character set for base32 hex encoding
 * Using digits 0-9 and lowercase letters a-v
 */
export declare const ENCODING = "0123456789abcdefghijklmnopqrstuv";
/** Length of encoded ID string */
export declare const ENCODED_LEN = 20;
/** Length of raw binary ID in bytes */
export declare const RAW_LEN = 12;
/**
 * Encode a 12-byte ID to a 20-character base32 hex string
 * @param id Raw 12-byte ID to encode
 * @throws Error if the ID is not exactly 12 bytes
 */
export declare function encode(id: Uint8Array): string;
/**
 * Decode a 20-character base32 hex string to a 12-byte ID
 * @param str String to decode
 * @returns Decoded 12-byte buffer or null if invalid
 */
export declare function decode(str: string): Uint8Array | null;
/**
 * Compare two byte arrays lexicographically
 * This makes IDs naturally sortable in databases and binary searches
 */
export declare function compareBytes(a: Uint8Array, b: Uint8Array): number;
