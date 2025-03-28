/**
 * @module nexid/env/adapters/web
 * 
 * Web browser-specific environment adapter.
 * 
 * ARCHITECTURE:
 * This module provides a browser-optimized implementation of the environment
 * adapter, utilizing browser-specific APIs like Web Crypto and browser fingerprinting.
 * It implements all the required capabilities defined in the FeatureSet,
 * with implementation choices that balance security, performance, and privacy
 * considerations in the browser context.
 * 
 * SECURITY:
 * - Uses Web Crypto API for cryptographically secure random bytes
 * - Implements privacy-respecting fingerprinting with minimal data collection
 * - Avoids persistent storage unless explicitly requested
 */

import { hash as subtleCryptoHash } from '../lib/hash-function/subtle-crypto';
import { getFingerprint } from '../lib/machine-id/web-fingerprint';
import { getProcessId } from '../lib/process-id/web';
import { randomBytes as webCryptoRandomBytes } from '../lib/random-bytes/web-crypto';
import { Environment, EnvironmentAdapter } from '../registry';

/**
 * Web environment adapter providing browser-optimized implementations
 * for all required capabilities.
 */
export const WebAdapter = new Environment({
  /** Uses Web Crypto API for secure random bytes generation */
  RandomBytes: webCryptoRandomBytes,
  
  /** Uses SubtleCrypto API for SHA-256 hashing */
  HashFunction: subtleCryptoHash,
  
  /** Uses privacy-focused browser fingerprinting */
  MachineId: getFingerprint,
  
  /** Generates a stable process ID for the current browser tab/window */
  ProcessId: getProcessId,
} as EnvironmentAdapter);
