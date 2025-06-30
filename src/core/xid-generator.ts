/**
 * @module nexid/core/xid-generator
 *
 * XID Generator - Core Implementation
 *
 * ARCHITECTURE:
 * This module implements the central ID generation algorithm for NeXID,
 * following the XID specification with custom enhancements for performance
 * and cross-environment compatibility. The generator manages the creation
 * of unique identifiers by combining:
 *
 * 1. Timestamp (4 bytes) - Current time in seconds
 * 2. Machine ID (3 bytes) - Environment-specific identifier
 * 3. Process ID (2 bytes) - Current process or context identifier
 * 4. Counter (3 bytes) - Thread-safe incrementing counter
 *
 * SECURITY:
 * - Uses cryptographically secure random sources when available
 * - Machine IDs are cryptographically hashed to prevent system information disclosure
 * - Random counter initialization to prevent predictable sequences
 *
 * PERFORMANCE:
 * - Pre-allocation of buffer template for minimal GC pressure
 * - Optimized byte manipulation for maximum throughput
 * - Provides fast path for string-only ID generation
 */

import { BYTE_MASK, PROCESS_ID_MASK, RAW_LEN } from 'nexid/common/constants';
import { Environment } from 'nexid/env/environment';
import { XIDBytes } from 'nexid/types/xid';
import { Generator } from 'nexid/types/xid-generator';
import { createAtomicCounter } from './counter';
import { encode } from './encoding';
import { XID } from './xid';

/**
 * Creates an XID generator with the specified environment and options.
 *
 * The generator ensures uniqueness through a combination of timestamp,
 * machine ID, process ID, and atomic counter components.
 *
 * @param env - Environment abstraction providing platform capabilities
 * @param options - Optional configuration parameters
 * @returns Promise resolving to generator API
 */
export async function XIDGenerator(
  env: Environment,
  options: Generator.Options = {}
): Promise<Generator.API> {
  // ==========================================================================
  // Setup components
  // ==========================================================================
  // Resolve capabilities
  const randomBytes = await env.get('RandomBytes', options.randomBytes || undefined);
  const hashFunction = await env.get('HashFunction');

  const userMachineId = options.machineId && (async () => options.machineId as string);
  const getMachineId = await env.get('MachineId', userMachineId || undefined);

  const userProcessId = options.processId && (async () => options.processId as number);
  let getProcessId = await env.get('ProcessId', userProcessId || undefined);

  // ==========================================================================
  // Constructor
  // ==========================================================================
  /**
   * Preset constant bytes (machine id & process id) into a base buffer
   * that will be reused for each XID generation.
   */
  const baseBuffer = new Uint8Array(RAW_LEN);

  // Machine ID (3 bytes)
  const machineId = await getMachineId();
  const machineIdBytes = (await hashFunction(machineId)).subarray(0, 3);
  baseBuffer[4] = machineIdBytes[0] & BYTE_MASK;
  baseBuffer[5] = machineIdBytes[1] & BYTE_MASK;
  baseBuffer[6] = machineIdBytes[2] & BYTE_MASK;

  // Process ID (2 bytes, big endian)
  const processId = (await getProcessId()) & PROCESS_ID_MASK;
  baseBuffer[7] = (processId >> 8) & BYTE_MASK;
  baseBuffer[8] = processId & BYTE_MASK;

  // Setup atomic counter
  const seedBytes = randomBytes(4);
  const randomSeed =
    (seedBytes[0] << 24) | (seedBytes[1] << 16) | (seedBytes[2] << 8) | seedBytes[3];

  const counter = createAtomicCounter(randomSeed);
  let lastTimestamp: number;

  // ==========================================================================
  // XID generation
  // ==========================================================================
  /**
   * Builds a new XID byte array with the specified timestamp.
   *
   * @param timestamp - Timestamp in milliseconds since epoch
   * @returns Immutable XID byte array
   */
  function buildXIDBytes(timestamp: number): Readonly<XIDBytes> {
    const buffer = new Uint8Array(baseBuffer);

    // Convert to seconds for the ID (XID spec uses seconds, not milliseconds)
    timestamp = Math.floor(timestamp / 1000);
    // If the last timestamp is undefined, initialize it with current
    lastTimestamp ??= timestamp;

    // Reset counter if timestamp changed.
    // This prevents wrapping to occur within the same second, in which case 2 successive XIDs
    // would sort counter-wise as [S][0xFF FF FF] -> [S][0x00 00 00], making K-ordering moot.
    // With this reset, we would need to generate 2^24 (~16.7M) XIDs/sec to incur a wrapping,
    // which is above the current library performance (~10.5M/sec).
    if (timestamp !== lastTimestamp) {
      counter.reset();
      lastTimestamp = timestamp;
    }

    // Timestamp (4 bytes, big endian)
    buffer[0] = (timestamp >> 24) & BYTE_MASK;
    buffer[1] = (timestamp >> 16) & BYTE_MASK;
    buffer[2] = (timestamp >> 8) & BYTE_MASK;
    buffer[3] = timestamp & BYTE_MASK;

    // Counter (3 bytes, big endian)
    const currentCounter = counter.getNext();
    buffer[9] = (currentCounter >> 16) & BYTE_MASK;
    buffer[10] = (currentCounter >> 8) & BYTE_MASK;
    buffer[11] = currentCounter & BYTE_MASK;

    return buffer as XIDBytes;
  }

  // ==========================================================================
  // Export API
  // ==========================================================================
  return {
    machineId,
    processId,
    /**
     * Generates a new XID with the specified timestamp (defaults to current time).
     *
     * @param datetime - Optional date to use instead of current time
     * @returns A new XID object
     */
    newId(datetime?: Date) {
      const timestamp = datetime instanceof Date ? +datetime : Date.now();
      return XID.fromBytes(buildXIDBytes(timestamp));
    },

    /**
     * Generates a new XID string directly, bypassing object creation.
     * This is approximately 30% faster than newId() when only the string
     * representation is needed.
     *
     * @returns A string representation of a new XID
     */
    fastId() {
      return encode(buildXIDBytes(Date.now()));
    },
  };
}
