/**
 * NeXID Utils - MAC Address Detection
 *
 * This module provides functionality for obtaining the MAC address of a network interface,
 * which can be used as part of the machine identification process. MAC addresses provide
 * a reasonably stable hardware identifier across system restarts, making them useful for
 * generating consistent machine IDs.
 *
 * The implementation prioritizes non-internal network interfaces with valid MAC addresses,
 * filtering out placeholder or loopback addresses.
 *
 * @module nexid/env/utils/mac-address
 */

import { Result } from 'nexid/types/result';

// ============================================================================
// MAC Address Detection
// ============================================================================

/**
 * Attempts to retrieve a valid MAC address from the system's network interfaces.
 *
 * This function:
 * 1. Gets all available network interfaces
 * 2. Prioritizes non-internal, physical interfaces (e.g., ethernet, wifi)
 * 3. Filters out invalid MAC addresses (e.g., 00:00:00:00:00:00)
 * 4. Returns the first valid MAC address found
 *
 * @returns A Promise that resolves to a Result containing either:
 *          - Ok with the MAC address string (e.g., "01:23:45:67:89:ab")
 *          - None if no valid MAC address was found
 *          - Err if an error occurred during the process
 * @example
 * ```typescript
 * const macResult = await getMacAddress();
 * if (macResult.isOk()) {
 *   const macAddress = macResult.unwrap();
 *   console.log(`Found MAC address: ${macAddress}`);
 *   // Use MAC address for machine ID generation
 * } else if (macResult.isNone()) {
 *   console.log('No valid MAC address found, using fallback identification');
 * } else {
 *   console.error('Error obtaining MAC address:', macResult.unwrapErr());
 * }
 * ```
 */
export async function getMacAddress(): Promise<Result<string>> {
  try {
    // Dynamically import os module to avoid issues in non-Node environments
    const os = await import('node:os');
    const networkInterfaces = os.networkInterfaces();

    for (const iface of Object.values(networkInterfaces).filter((ni) => ni !== undefined)) {
      for (const info of iface) {
        // Only use non-internal interfaces with valid MAC addresses
        if (!info.internal && info.mac && info.mac !== '00:00:00:00:00:00') {
          return Result.Ok(info.mac);
        }
      }
    }

    return Result.None();
  } catch (error) {
    return Result.Err(error);
  }
}
