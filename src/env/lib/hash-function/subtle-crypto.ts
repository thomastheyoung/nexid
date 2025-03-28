/**
 * @module nexid/env/lib/hash-function/subtle-crypto
 * 
 * Web Crypto API implementation of SHA-256 hashing.
 * 
 * ARCHITECTURE:
 * This module provides an implementation of the HashFunction feature using
 * the Web Crypto API's SubtleCrypto interface. It creates a SHA-256 hash of
 * the input data, which is used to transform machine IDs and other identifiers
 * into a format that doesn't expose sensitive information.
 * 
 * SECURITY:
 * - Uses the browser's native cryptographic implementation
 * - Provides a cryptographically secure hash for data protection
 * - Handles both string and binary input formats using TextEncoder
 */

import { FeatureSet } from 'nexid/env/registry';

/**
 * Creates a SHA-256 hash of the input data using the Web Crypto API.
 * Automatically converts string input to UTF-8 byte array before hashing.
 * 
 * @param data - String or byte array to hash
 * @returns Promise resolving to a 32-byte Uint8Array containing the hash
 */
export const hash: FeatureSet['HashFunction'] = async (data: string | Uint8Array) => {
  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    data = encoder.encode(data);
  }
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(buffer);
};
