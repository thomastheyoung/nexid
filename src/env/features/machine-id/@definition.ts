/**
 * @module nexid/env/lib/machine-id
 *
 * Machine ID feature definition and fallback implementation.
 *
 * ARCHITECTURE:
 * This module defines the interface and validation for the MachineId feature,
 * which is responsible for generating a consistent identifier for the current
 * machine/device. This component is critical for ensuring ID uniqueness across
 * different devices in a distributed system.
 *
 * Different platforms expose machine identification in different ways:
 * - Server environments may use MAC addresses, hostname, or OS-specific identifiers
 * - Browsers use fingerprinting techniques while respecting privacy
 * - Mobile devices have their own device identifiers
 *
 * SECURITY:
 * - Machine IDs should be stable but not expose sensitive system information
 * - The machine ID is cryptographically hashed before use in XIDs
 * - Fallback implementation provides uniqueness but with appropriate warnings
 */

import { FeatureDefinition } from 'nexid/env/registry';

/**
 * Definition of the MachineId feature including validation and fallback.
 */
export const MachineIdDefinition: FeatureDefinition<'MachineId'> = {
  /**
   * Tests if the provided implementation is a valid MachineId function.
   *
   * @param impl - The implementation to test
   * @returns Promise resolving to true if the implementation is valid
   */
  async test(impl: unknown): Promise<boolean> {
    if (typeof impl !== 'function') return false;
    try {
      const result = await impl();
      return typeof result === 'string' && result.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Generates a random machine ID when no hardware identifiers are available.
   * This fallback uses a combination of timestamp and random values to create
   * a reasonably unique identifier that won't collide with other instances.
   *
   * SECURITY NOTE: This implementation is NOT cryptographically secure
   * and should not be used for any security-critical purposes.
   *
   * @returns A Promise that resolves to a machine identifier string
   */
  async fallback(): Promise<string> {
    console.warn('Using non-secure fallback (machine id)');
    const timestamp = Date.now().toString(36);
    const random = () => Math.random().toString(36).substring(2, 10);
    return `${random()}-${timestamp}-${random()}`;
  },
};
