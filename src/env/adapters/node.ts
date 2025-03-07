/**
 * NeXID Environment - Node.js Adapter Implementation
 *
 * This module provides the Node.js-specific implementation of the environment adapter.
 * It leverages Node.js built-in modules and APIs to provide platform-specific
 * functionality for cryptographic operations, machine identification, and process
 * tracking.
 *
 * The Node.js adapter uses:
 * - crypto module for secure random generation and hashing
 * - os module for hostname and system information
 * - process object for process ID access
 * - MAC address detection as a fallback for machine identification
 *
 * @module nexid/env/adapters/node
 */

import { Result } from 'nexid/types/result';
import crypto from 'node:crypto';
import os from 'node:os';
import { EnvironmentAdapter } from './base';

// ============================================================================
// Node.js Adapter Implementation
// ============================================================================

/**
 * Environment adapter for Node.js runtime environments.
 *
 * This adapter provides optimized implementations for Node.js,
 * leveraging built-in modules for security and performance.
 */
export class NodeAdapter implements EnvironmentAdapter {
  /**
   * Generates cryptographically secure random bytes using Node.js crypto module.
   *
   * @param size - Number of random bytes to generate
   * @returns A Uint8Array containing the random bytes
   */
  public randomBytes(size: number): Uint8Array {
    const buffer = crypto.randomBytes(size);
    return new Uint8Array(buffer);
  }

  /**
   * Generates a SHA-256 hash of the input data using Node.js crypto module.
   *
   * @param data - The data to hash, either as a string or byte array
   * @returns A Promise that resolves to a Uint8Array containing the hash
   */
  public async hash(data: string | Uint8Array): Promise<Uint8Array> {
    const buffer = crypto.createHash('sha256').update(data).digest();
    return new Uint8Array(buffer);
  }

  /**
   * Retrieves a unique identifier for the current machine.
   * Tries the hostname first, then falls back to MAC address if available.
   *
   * @returns A Promise that resolves to a Result containing the machine ID or an error
   */
  public async getMachineId(): Promise<Result<string>> {
    try {
      // First try to use the hostname as a machine identifier
      let hostname: string = os.hostname();
      if (hostname) {
        return Result.Ok(hostname);
      }

      // Fall back to MAC address if hostname isn't available
      const { getMacAddress } = await import('../utils/mac-address.js');
      const macAddress: Result<string> = await getMacAddress();
      if (macAddress.isOk()) {
        return Result.Ok(macAddress.unwrap());
      }
    } catch (error) {
      return Result.Err(error);
    }
    return Result.None();
  }

  /**
   * Retrieves the current process ID from the Node.js process object.
   *
   * @returns A Promise that resolves to a Result containing the process ID
   */
  public async getProcessId(): Promise<Result<number>> {
    if (typeof process?.pid === 'number') {
      return Result.Ok(process.pid);
    }
    return Result.None();
  }
}
