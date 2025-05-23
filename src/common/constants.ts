/**
 * @module nexid/common/constants
 *
 * Core constants used throughout the NeXID library.
 *
 * ARCHITECTURE:
 * This module centralizes all constant values used in XID encoding,
 * generation, and manipulation. By isolating these values, we ensure
 * consistent behavior across all components and provide a single source
 * of truth for key parameters of the XID specification.
 */

/**
 * Character set for base32-hex encoding.
 * Uses digits 0-9 and lowercase letters a-v, creating an URL-safe encoding.
 * This alphabet is compatible with the original XID specification.
 */
export const ENCODING = '0123456789abcdefghijklmnopqrstuv';

/**
 * Length of the encoded ID string (20 characters).
 * Each 5 bits of the 12-byte binary ID is encoded as one character.
 */
export const ENCODED_LEN = 20;

/**
 * Length of the raw binary ID in bytes (12 bytes / 96 bits).
 * This consists of 4 bytes timestamp + 3 bytes machine ID + 2 bytes process ID + 3 bytes counter.
 */
export const RAW_LEN = 12;

/** 8-bit (1 byte) mask for byte operations */
export const BYTE_MASK = 0xff;

/** 16-bit (2 bytes) mask for process ID */
export const PROCESS_ID_MASK = 0xffff;
