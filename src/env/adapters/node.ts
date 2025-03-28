/**
 * @module nexid/env/adapters/node
 * 
 * Node.js-specific environment adapter.
 * 
 * ARCHITECTURE:
 * This module provides a Node.js-optimized implementation of the environment
 * adapter, utilizing Node-specific APIs and capabilities like crypto and OS modules.
 * It implements all required capabilities defined in the FeatureSet with
 * high-performance, secure implementations suitable for server environments.
 * 
 * SECURITY:
 * - Uses Node.js crypto module for cryptographically secure operations
 * - Implements OS-based machine identification with secure hashing
 * - Uses Node.js process ID for stable identification
 */

import { hash as cryptoHash } from '../lib/hash-function/node-crypto';
import { getOSMachineId } from '../lib/machine-id/server-os';
import { getProcessId } from '../lib/process-id/node-pid';
import { randomBytes as cryptoRandomBytes } from '../lib/random-bytes/node-crypto';
import { Environment, EnvironmentAdapter } from '../registry';

/**
 * Node.js environment adapter providing server-optimized implementations
 * for all required capabilities.
 */
export const NodeAdapter = new Environment({
  /** Uses Node.js crypto module for secure random bytes */
  RandomBytes: cryptoRandomBytes,
  
  /** Uses Node.js crypto module for SHA-256 hashing */
  HashFunction: cryptoHash,
  
  /** Derives a stable machine ID from operating system information */
  MachineId: getOSMachineId,
  
  /** Uses the current Node.js process ID */
  ProcessId: getProcessId,
} as EnvironmentAdapter);
