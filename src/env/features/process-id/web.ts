/**
 * @module nexid/env/features/process-id/web
 *
 * Process ID generation for web browser environments.
 *
 * ARCHITECTURE:
 * This module provides a simple implementation of process ID generation for
 * web environments. Since browsers don't have a concept of process IDs like
 * server environments do, this implementation generates a random value that
 * remains stable for the lifetime of the page/tab.
 *
 * In browser contexts, the "process ID" serves to differentiate between
 * different tabs or windows of the same origin, ensuring that IDs generated
 * in separate browser contexts don't collide even on the same device.
 *
 * PERFORMANCE:
 * This implementation uses crypto.getRandomValues() for high-quality
 * randomness. Since the process ID is only one component of the XID
 * and only needs to differentiate between browser contexts, a single
 * random 16-bit value provides sufficient uniqueness.
 */

import { FeatureSet } from 'nexid/env/registry';

/**
 * Generates a random process ID for browser environments.
 *
 * The generated value simulates a process ID in web contexts where
 * no native concept of process exists. The random value is limited
 * to the valid range for the process ID component of an XID.
 *
 * @returns Promise resolving to a random process ID between 0 and PROCESS_ID_MASK (65535)
 */
export const getProcessId: FeatureSet['ProcessId'] = (): number => {
  // Generates a random 16-bit unsigned integer (0 to 65535)
  return crypto.getRandomValues(new Uint16Array(1))[0];
};
