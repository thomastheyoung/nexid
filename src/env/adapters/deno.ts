/**
 * NeXID Environment - Deno Adapter Implementation
 *
 * This module provides the Deno-specific implementation of the environment adapter.
 * It leverages Deno's built-in APIs to provide platform-specific functionality for
 * cryptographic operations, machine identification, and process tracking.
 *
 * The Deno adapter uses:
 * - Deno's built-in crypto namespace for secure random generation
 * - Deno.hostname() for machine identification
 * - MAC address detection as a fallback for machine identification
 * - Deno.pid for process identification
 *
 * @module nexid/env/adapters/deno
 */

import { Result } from 'nexid/types/result.js';
import { EnvironmentAdapter } from './base.js';

// ============================================================================
// Deno Adapter Implementation
// ============================================================================

/**
 * Environment adapter for Deno runtime environments.
 *
 * This adapter provides optimized implementations for Deno,
 * leveraging Deno's built-in APIs for security and performance.
 */
export class DenoAdapter implements EnvironmentAdapter {
  /**
   * Generates cryptographically secure random bytes using Deno's crypto API.
   *
   * @param size - Number of random bytes to generate
   * @returns A Uint8Array containing the random bytes
   */
  public randomBytes(size: number): Uint8Array {
    const byteArray = new Uint8Array(size);
    globalThis.crypto.getRandomValues(byteArray);
    return byteArray;
  }

  /**
   * Generates a SHA-256 hash of the input data using Deno's crypto API.
   *
   * @param data - The data to hash, either as a string or byte array
   * @returns A Promise that resolves to a Uint8Array containing the hash
   */
  public async hash(data: string | Uint8Array): Promise<Uint8Array> {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      data = encoder.encode(data);
    }
    const buffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(buffer);
  }

  /**
   * Retrieves a unique identifier for the current machine.
   * Tries the hostname first, then falls back to MAC address if available.
   *
   * @returns A Promise that resolves to a Result containing the machine ID or an error
   */
  public async getMachineId(): Promise<Result<string>> {
    let hostname: string = globalThis.Deno.hostname();
    if (hostname) {
      return Result.Ok(hostname);
    }

    const { getMacAddress } = await import('../utils/mac-address.js');
    const macAddress: Result<string> = await getMacAddress();
    if (macAddress.isOk()) {
      return Result.Ok(macAddress.unwrap());
    }
    return Result.None();
  }

  /**
   * Retrieves the current process ID from Deno.pid.
   *
   * @returns A Promise that resolves to a Result containing the process ID or None if unavailable
   */
  public async getProcessId(): Promise<Result<number>> {
    if (typeof globalThis.Deno?.pid === 'number') {
      return Result.Ok(globalThis.Deno.pid);
    }
    return Result.None();
  }
}
