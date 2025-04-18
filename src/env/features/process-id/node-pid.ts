/**
 * @module nexid/env/features/process-id/node-pid
 *
 * Process ID retrieval for Node.js environments.
 *
 * ARCHITECTURE:
 * This module provides an implementation to retrieve the current process ID
 * in Node.js environments. It uses the built-in process.pid value and masks
 * it to fit within the 2-byte space allocated for process IDs in the XID format.
 *
 * The process ID component helps distinguish between different processes
 * running on the same machine, ensuring that even when multiple processes
 * generate IDs at the same time, they won't collide.
 */

import { PROCESS_ID_MASK } from 'nexid/common/constants';
import { FeatureSet } from 'nexid/env/registry';

/**
 * Retrieves the current Node.js process ID, masked to fit within 2 bytes.
 *
 * @returns Promise resolving to the masked process ID
 */
export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  return process.pid & PROCESS_ID_MASK;
};
