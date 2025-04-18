/**
 * @module nexid/env/features/hash-function/node-crypto
 *
 * Node.js crypto implementation of SHA-256 hashing.
 *
 * ARCHITECTURE:
 * This module provides an implementation of the HashFunction feature using
 * the Node.js crypto module. It creates a SHA-256 hash of the input data,
 * which is used to transform machine IDs and other identifiers into a format
 * that doesn't expose sensitive system information.
 *
 * SECURITY:
 * - Uses the standard Node.js crypto library's SHA-256 implementation
 * - Provides a cryptographically secure hash for data protection
 * - Handles both string and binary input formats
 */

import { FeatureSet } from 'nexid/env/registry';
import crypto from 'node:crypto';

/**
 * Creates a SHA-256 hash of the input data using Node.js crypto.
 *
 * @param data - String or byte array to hash
 * @returns Promise resolving to a 32-byte Uint8Array containing the hash
 */
export const hash: FeatureSet['HashFunction'] = async (data: string | Uint8Array) => {
  const buffer = crypto.createHash('sha256').update(data).digest();
  return new Uint8Array(buffer);
};
