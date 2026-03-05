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
 * COUNTER SEEDING:
 * The counter is re-seeded with a full 24-bit random value on each new second,
 * matching the Go rs/xid reference implementation. This was a deliberate choice
 * over the previous 20-bit masked seed:
 *
 * - 20-bit mask: byte[9] limited to 0x00–0x0F (16 values), ~15.7M headroom
 * - 24-bit full: byte[9] spans 0x00–0xFF (256 values), 0–16M headroom
 *
 * The wrap risk (seed + increments > 2^24 within one second) is acceptable because:
 * 1. Real workloads rarely exceed 100K IDs/sec from a single process
 * 2. Even at the library's ~10.5M/sec benchmark ceiling, the probability of a
 *    seed high enough to cause wrapping is ~63% × (1 / seconds of sustained load)
 * 3. Wrapping only causes a local K-ordering inversion within that second — IDs
 *    remain globally unique, and the next second re-seeds fresh
 * 4. The Go reference implementation makes the same tradeoff
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
import { XIDBytes, XIDString } from 'nexid/types/xid';
import { Generator } from 'nexid/types/xid-generator';

import { createAtomicCounter } from './counter';
import { encode } from './encoding';
import type { WordFilterFn } from './word-filter';
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
export function XIDGenerator(env: Environment, hashMachineId: HashFn, options: Generator.Options = {}): Generator.API {
  // ==========================================================================
  // Setup components
  // ==========================================================================
  // Word filter (opt-in)
  const wordFilter: WordFilterFn | null = options.wordFilter ?? null;
  const maxFilterRetries = Math.max(0, Math.floor(options.maxFilterRetries ?? 10));

  // Resolve capabilities
  const randomBytes = env.get('RandomBytes', options.randomBytes ?? undefined);

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
  // Use a full 24-bit random seed, matching the Go rs/xid reference implementation.
  // This maximizes counter entropy at the cost of a theoretical wrap risk if a single
  // process generates >16M IDs within the same second — unreachable in practice.
  const nextSeed = () => {
    const b = randomBytes(3);
    return (b[0] << 16) | (b[1] << 8) | b[2];
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

    // Re-seed counter when the second changes, so each second starts from a fresh
    // random position. This provides K-ordering (monotonic within a second) while
    // distributing counter bytes uniformly across the full 24-bit range.
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
  // Word filter retry helper
  // ==========================================================================
  /**
   * Encodes and checks the filter, retrying with a new counter value on
   * rejection. Returns the encoded string that passed (or the last attempt
   * after exhausting retries).
   *
   * Each retry consumes one counter value via buildXIDBytes → counter.getNext().
   */
  function encodeFiltered(timestamp: number): { bytes: Readonly<XIDBytes>; encoded: XIDString } {
    let bytes: Readonly<XIDBytes>;
    let encoded: XIDString;

    for (let attempt = 0; attempt <= maxFilterRetries; attempt++) {
      bytes = buildXIDBytes(timestamp);
      encoded = encode(bytes);
      if (!wordFilter!(encoded as string)) {
        return { bytes: bytes!, encoded: encoded! };
      }
    }

    // Exhausted retries — return the last generated ID.
    // With ~50 blocked words of 3-5 chars in a 20-char base-32 string,
    // reaching this point is astronomically unlikely.
    return { bytes: bytes!, encoded: encoded! };
  }

  // ==========================================================================
  // Export API
  // ==========================================================================
  // Expose hashed machine ID bytes (hex) rather than raw system identifier
  const machineIdHex = Array.from(machineIdBytes, b => b.toString(16).padStart(2, '0')).join('');

  return {
    machineId: machineIdHex,
    processId,
    degraded: env.degraded,
    /**
     * Generates a new XID with the specified timestamp (defaults to current time).
     *
     * @param datetime - Optional date to use instead of current time
     * @returns A new XID object
     */
    newId(datetime?: Date) {
      let timestamp: number;
      if (datetime instanceof Date) {
        timestamp = +datetime;
        if (Number.isNaN(timestamp)) throw new Error('Invalid Date passed to newId()');
      } else {
        timestamp = Date.now();
      }
      if (wordFilter) {
        return XID.fromBytes(encodeFiltered(timestamp).bytes);
      }
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
      if (wordFilter) {
        return encodeFiltered(Date.now()).encoded;
      }
      return encode(buildXIDBytes(Date.now()));
    },
  };
}
