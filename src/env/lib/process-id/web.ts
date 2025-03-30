/**
 * @module nexid/env/lib/process-id/web
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
 * This implementation uses Math.random() which is very fast but less random
 * than cryptographic solutions. Since the process ID is only one component
 * of the XID and only needs to differentiate between browser contexts,
 * this approach provides a good balance of performance and uniqueness.
 */

import { PROCESS_ID_MASK } from 'nexid/common/constants';
import { FeatureSet } from 'nexid/env/registry';

/**
 * Generates a random process ID for browser environments.
 *
 * The generated value simulates a process ID in web contexts where
 * no native concept of process exists. The random value is limited
 * to the valid range for the process ID component of an XID.
 *
 * @returns Promise resolving to a random process ID between 0xff (255) and PROCESS_ID_MASK (65535)
 */
export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  return Math.floor(Math.random() * (PROCESS_ID_MASK - 0xff + 1)) + 0xff;
};
