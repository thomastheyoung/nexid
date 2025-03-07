/**
 * NeXID Core - XID Generator Implementation
 *
 * This module provides the core generation functionality for XIDs - globally unique,
 * sortable identifiers. It implements a high-performance, thread-safe generator
 * that works across different JavaScript environments (Node.js, browsers) with
 * appropriate platform-specific adaptations.
 *
 * The generator ensures uniqueness through a combination of:
 * - Timestamp: 4 bytes representing seconds since Unix epoch
 * - Machine ID: 3 bytes derived from platform-specific identifiers
 * - Process ID: 2 bytes from the current process or a random value
 * - Counter: 3 bytes that increment for each ID generated within the same second
 *
 * @module nexid/core/xid-generator
 */

import { Environment } from 'nexid/env';
import { Adapter } from 'nexid/env/adapters/base';
import { RuntimeEnvironment } from 'nexid/types/platform';
import { encode, RAW_LEN } from './encoding';
import { validateRandomBytesFunction } from './validators';
import { BYTE_MASK, XID } from './xid';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for creating a custom XID generator.
 * These options allow for fine-grained control over the components
 * used in ID generation.
 */
export interface CustomGeneratorOptions {
  /**
   * Custom machine ID to use
   * If not provided, a platform-specific value will be generated
   */
  machineId?: string;

  /**
   * Custom process ID to use (must be a number)
   * If not provided, a platform-specific or random ID will be generated
   */
  processId?: number;

  /**
   * Custom function to generate random bytes
   * Must return a Uint8Array of the requested size
   * If not provided, a cryptographically secure random source will be used
   */
  randomSource?: (size: number) => Uint8Array;
}

// ============================================================================
// XIDGenerator Implementation
// ============================================================================

/**
 * Generator for creating XID instances.
 *
 * This class handles the generation of globally unique XIDs.
 * The generator is thread-safe and ensures uniqueness across multiple calls,
 * even when generating IDs at high rates within the same timestamp second.
 */
export class XIDGenerator {
  /**
   * The detected runtime environment
   */
  public readonly environment: RuntimeEnvironment;

  /**
   * Machine identifier component used in generated IDs (3 bytes)
   */
  public readonly machineId: Uint8Array;

  /**
   * Process identifier component used in generated IDs (16-bit value)
   */
  public readonly pid: number;

  /**
   * Counter for ensuring uniqueness within the same second.
   * Uses atomic operations for thread safety.
   * @private
   */
  private atomicCounter: Uint32Array;

  /**
   * Random seed used to initialize the counter.
   * @private
   */
  private randomSeed: number;

  /**
   * Creates a new XID generator with the specified components.
   * Note: Use the `build()` static method to create instances instead of this constructor.
   *
   * @param env - The runtime environment identifier
   * @param machineId - 3-byte machine identifier
   * @param processId - Process identifier (16-bit value)
   * @param randomSeed - Initial random seed for the counter (24-bit value)
   * @private
   */
  private constructor(
    env: RuntimeEnvironment,
    machineId: Uint8Array,
    processId: number,
    randomSeed: number
  ) {
    this.environment = env;
    this.machineId = machineId;
    this.pid = processId;
    this.randomSeed = randomSeed;

    // Create a SharedArrayBuffer and a Uint32Array view for the counter.
    // Atomics provide thread-safe counter updates without locks, enabling parallel ID generation.
    const sharedCounterBuffer = new SharedArrayBuffer(4);
    this.atomicCounter = new Uint32Array(sharedCounterBuffer);

    // Initialize counter with the random seed
    this.atomicCounter[0] = this.randomSeed;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Generates a new XID using the current timestamp or a provided date.
   *
   * @param datetime - Optional Date object to use as the timestamp source
   *                  If not provided, the current date/time will be used
   * @returns A new XID instance
   * @example
   * ```typescript
   * // Generate with current timestamp
   * const id = generator.newId();
   *
   * // Generate with a specific date
   * const pastId = generator.newId(new Date('2023-01-01'));
   * ```
   */
  public newId(datetime?: Date): XID {
    const timestamp = datetime instanceof Date ? +datetime : Date.now();
    const id = this.createId(timestamp);
    return new XID(id);
  }

  /**
   * Generates a new ID directly as a string, without creating an intermediate XID object.
   * This is more efficient when you only need the string representation.
   *
   * @returns A 20-character string representation of the newly generated ID
   * @example
   * ```typescript
   * // Get ID as string (faster than newId().toString())
   * const idString = generator.fastId();
   * ```
   */
  public fastId(): string {
    const now = Date.now();
    return encode(this.createId(now));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Retrieves and increments the counter atomically.
   * Ensures thread-safe operation when generating IDs concurrently.
   * Returns the counter's lower 24 bits (3 bytes) to fit in the ID structure.
   *
   * @returns The current counter value before incrementing
   * @private
   */
  private getAtomicCounter(): number {
    // Atomics.add returns the previous value and ensures thread safety
    const curr: number = Atomics.add(this.atomicCounter, 0, 1);
    // With a 32-bit counter, wrapping is rare (every 2^32 increments).
    // When wrapping around, we add entropy based on the original seed.
    if (curr === 0) {
      this.atomicCounter[0] = (this.randomSeed * Math.random()) & 0xffff;
    }
    return curr & 0xffffff;
  }

  /**
   * Creates the raw 12-byte ID buffer with the appropriate components.
   *
   * The structure follows the XID format:
   * - 4 bytes: timestamp (milliseconds since epoch, truncated to seconds)
   * - 3 bytes: machine ID
   * - 2 bytes: process ID
   * - 3 bytes: counter value
   *
   * @param timestamp - Timestamp in milliseconds to use for the ID
   * @returns A 12-byte Uint8Array containing the ID data
   * @private
   */
  private createId(timestamp: number): Uint8Array {
    // Convert to seconds for the ID (XID spec uses seconds, not milliseconds)
    timestamp = Math.floor(timestamp / 1000);

    const id = new Uint8Array(RAW_LEN);

    // Timestamp (4 bytes, big endian)
    id[0] = (timestamp >> 24) & BYTE_MASK;
    id[1] = (timestamp >> 16) & BYTE_MASK;
    id[2] = (timestamp >> 8) & BYTE_MASK;
    id[3] = timestamp & BYTE_MASK;

    // Machine ID (3 bytes)
    id[4] = this.machineId[0] & BYTE_MASK;
    id[5] = this.machineId[1] & BYTE_MASK;
    id[6] = this.machineId[2] & BYTE_MASK;

    // Process ID (2 bytes, specs don't specify endianness, but we use big endian)
    id[7] = (this.pid >> 8) & BYTE_MASK;
    id[8] = this.pid & BYTE_MASK;

    // Counter (3 bytes, big endian)
    const currentCounter = this.getAtomicCounter();
    id[9] = (currentCounter >> 16) & BYTE_MASK;
    id[10] = (currentCounter >> 8) & BYTE_MASK;
    id[11] = currentCounter & BYTE_MASK;

    return id;
  }

  // ============================================================================
  // Static Methods
  // ============================================================================

  /**
   * Creates a new XID generator with environment-specific settings.
   *
   * This factory method:
   * 1. Detects the current runtime environment (Node.js or Browser)
   * 2. Loads the appropriate environment adapter
   * 3. Initializes generator components (machine ID, process ID, random source)
   * 4. Applies any custom options provided
   *
   * The generator's components are carefully selected to ensure strong uniqueness
   * guarantees across different environments and use cases.
   *
   * @param options - Optional configuration for customizing the generator
   * @returns A Promise that resolves to a new XIDGenerator instance
   * @throws Error if environment detection fails or required components can't be initialized
   *
   * @example
   * ```typescript
   * // Create a default generator that adapts to the current environment
   * const generator = await XIDGenerator.build();
   *
   * // Create a generator with custom options
   * const customGenerator = await XIDGenerator.build({
   *   machineId: 'custom-machine-id',
   *   processId: 12345,
   *   randomSource: (size) => {
   *     // Your custom secure random implementation
   *     const bytes = new Uint8Array(size);
   *     // Fill with random values...
   *     return bytes;
   *   }
   * });
   * ```
   */
  public static async build(options: CustomGeneratorOptions = {}): Promise<XIDGenerator> {
    try {
      // Detect the current runtime environment
      const container: Environment.Container = await Environment.setup();

      // Get environment-specific components
      let randomBytes: Adapter.RandomBytes = container.randomBytes;
      let hash: Adapter.Hash = container.hash;
      let machineId: string = container.machineId;
      let processId: number = container.processId;

      // Override with custom options if provided

      // 1. Apply custom machine ID if provided
      if (typeof options.machineId === 'string') {
        machineId = options.machineId;
      }
      // Use first 3 bytes of machineId hash
      const machineIdBytes = new Uint8Array((await hash(machineId)).subarray(0, 3));

      // 2. Apply custom process ID if provided
      if (typeof options.processId === 'number') {
        processId = options.processId;
      }
      processId = processId & 0xffff;

      // 3. Apply custom random source if provided
      if (options.randomSource) {
        const userInput = validateRandomBytesFunction(options.randomSource);
        if (userInput.isOk()) {
          randomBytes = userInput.unwrap().bind(userInput);
        }
      }

      // 4. Generate a random seed to initialize the counter
      // We use multiple calls to ensure high entropy even with weaker random sources
      const b1 = randomBytes(3);
      const b2 = randomBytes(3);
      const b3 = randomBytes(3);
      const randomSeed = (b1[0] << 16) | (b2[1] << 8) | b3[2];

      // Create and return the generator instance
      return new XIDGenerator(container.runtime, machineIdBytes, processId, randomSeed);
    } catch (err) {
      throw err;
    }
  }
}
