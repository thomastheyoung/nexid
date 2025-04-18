/**
 * @module nexid/env/features/process-id
 *
 * Process ID feature definition and fallback implementation.
 *
 * ARCHITECTURE:
 * This module defines the interface and validation for the ProcessId feature,
 * which provides a stable identifier for the current process or execution context.
 * This component helps ensure uniqueness of XIDs generated within the same machine
 * but by different processes or contexts.
 *
 * Different runtimes have different concepts of "process":
 * - Node.js has actual process IDs from the operating system
 * - Browsers use tab/window IDs or random values that are stable during a session
 * - Workers and service workers track their context IDs
 *
 * The process ID is a 2-byte value in the XID, allowing for up to 65,535 unique
 * processes or contexts on a single machine without risk of collisions.
 */

import { FeatureDefinition } from 'nexid/env/registry';

/**
 * Definition of the ProcessId feature including validation and fallback.
 */
export const ProcessIdDefinition: FeatureDefinition<'ProcessId'> = {
  /**
   * Tests if the provided implementation is a valid ProcessId function.
   *
   * @param impl - The implementation to test
   * @returns Promise resolving to true if the implementation is valid
   */
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = await impl();
      return typeof result === 'number' && result > 0;
    } catch {
      return false;
    }
  },

  /**
   * Generates a random process ID when process information is unavailable.
   * This ensures IDs can still be generated with some level of uniqueness.
   *
   * @returns A Promise that resolves to a randomly generated process ID
   */
  async fallback(): Promise<number> {
    console.warn('Using non-secure fallback (process id)');
    // Generate a random number between 1 and 65535 (0xFFFF)
    return Math.floor(Math.random() * 0xffff) + 1;
  },
};
