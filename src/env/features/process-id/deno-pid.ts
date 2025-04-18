/**
 * @module nexid/env/features/process-id/deno-pid
 *
 * Process ID retrieval for Deno runtime environments.
 *
 * ARCHITECTURE:
 * This module provides an implementation to retrieve the current process ID
 * in Deno runtime environments. It accesses the built-in Deno.pid value and masks
 * it to fit within the 2-byte space allocated for process IDs in the XID format.
 *
 * Similar to Node.js, Deno provides access to the underlying OS process ID,
 * enabling stable identification of different runtime instances on the same machine.
 * The process ID is masked with PROCESS_ID_MASK to ensure it fits within the
 * allocated 2 bytes in the XID structure.
 */

import { PROCESS_ID_MASK } from 'nexid/common/constants';
import { FeatureSet } from 'nexid/env/registry';

/**
 * Retrieves the current Deno process ID, masked to fit within 2 bytes.
 *
 * @returns Promise resolving to the masked process ID
 */
export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  return Deno.pid & PROCESS_ID_MASK;
};
