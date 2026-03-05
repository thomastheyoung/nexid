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

export type HashFn = (data: string | Uint8Array) => Uint8Array;

/**
 * Creates an XID generator with the specified environment and options.
 *
 * The generator ensures uniqueness through a combination of timestamp,
 * machine ID, process ID, and atomic counter components.
 *
 * @param env - Environment abstraction providing platform capabilities
 * @param hashMachineId - Hash function for machine ID hashing
 * @param options - Optional configuration parameters
 * @returns Generator API
 */
export function XIDGenerator(
  env: Environment,
  hashMachineId: HashFn,
  options: Generator.Options = {}
): Generator.API {
  // ==========================================================================
  // Setup components
  // ==========================================================================
  // Resolve capabilities
  const randomBytes = env.get('RandomBytes', options.randomBytes || undefined);

  const mid = options.machineId;
  const getMachineId = env.get('MachineId', mid ? () => mid : undefined);

  const pid = options.processId;
  const getProcessId = env.get('ProcessId', pid != null ? () => pid : undefined);

  // ==========================================================================
  // Constructor
  // ==========================================================================
  /**
   * Preset constant bytes (machine id & process id) into a base buffer
   * that will be reused for each XID generation.
   */
  const baseBuffer = new Uint8Array(RAW_LEN);

  // Machine ID (3 bytes)
  const machineId = getMachineId();
  const machineIdBytes = hashMachineId(machineId).subarray(0, 3);
  baseBuffer[4] = machineIdBytes[0] & BYTE_MASK;
  baseBuffer[5] = machineIdBytes[1] & BYTE_MASK;
  baseBuffer[6] = machineIdBytes[2] & BYTE_MASK;

  // Process ID (2 bytes, big endian)
  const processId = getProcessId() & PROCESS_ID_MASK;
  baseBuffer[7] = (processId >> 8) & BYTE_MASK;
  baseBuffer[8] = processId & BYTE_MASK;

  // Setup atomic counter with random re-seeding.
  // Mask seed to 20 bits so the visible 24-bit counter starts at most at 0x0FFFFF (~1M),
  // leaving ~15.7M increments before the 24-bit output wraps — well above the library's
  // throughput ceiling (~10.5M/sec), which guarantees K-ordering within any single second.
  const nextSeed = () => {
    const b = randomBytes(4);
    return (((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0) & 0x0fffff;
  };

  const counter = createAtomicCounter(nextSeed());
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

    // Re-seed counter if timestamp changed.
    // This prevents wrapping within the same second, where successive XIDs would sort
    // counter-wise as [S][0xFF FF FF] -> [S][0x00 00 00], breaking K-ordering.
    // The seed is masked to 20 bits (max ~1M), so ~15.7M increments remain before
    // the 24-bit output wraps — well above the library's ~10.5M/sec throughput.
    if (timestamp !== lastTimestamp) {
      counter.reset(nextSeed());
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
  // Expose hashed machine ID bytes (hex) rather than raw system identifier
  const machineIdHex = Array.from(machineIdBytes, b => b.toString(16).padStart(2, '0')).join('');

  return {
    machineId: machineIdHex,
    processId,
    get degraded() { return env.degraded; },
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
