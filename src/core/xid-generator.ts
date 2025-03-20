/**
 * @module nexid/core/xid-generator
 *
 * Thread-safe XID generator with controlled state management.
 *
 * This module provides a functional generator API while carefully managing
 * the stateful counter required for sequential ID generation. It follows the
 * "functional core, imperative shell" pattern where counter state is isolated
 * and encapsulated while the API remains predominantly functional.
 *
 * CAPABILITIES:
 * - Generate globally unique XIDs with strong ordering guarantees
 * - Thread-safe ID generation using atomic operations
 * - Environment-aware adaptation across different JavaScript runtimes
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────┐
 * │              Function-based API                 │
 * └────────────────────────┬────────────────────────┘
 *                          │
 *                          ▼
 * ┌─────────────────────────────────────────────────┐
 * │  Isolated State Cell (SharedArrayBuffer+Atomics)│
 * └────────────────────────┬────────────────────────┘
 *                          │
 *                          ▼
 * ┌─────────────────────────────────────────────────┐
 * │     Environment-specific Adapter Functions      │
 * └─────────────────────────────────────────────────┘
 */

import { Environment } from '../env';
import { RuntimeEnvironment } from '../types/platform';
import { encode, RAW_LEN } from './encoding';
import { validateRandomBytesFunction } from './validators';
import { BYTE_MASK, createXID, XID } from './xid';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for creating a custom XID generator.
 */
export type GeneratorOptions = Readonly<{
  /** Custom machine ID to use */
  machineId?: string;

  /** Custom process ID to use (must be a number) */
  processId?: number;

  /** Custom function to generate random bytes */
  randomSource?: (size: number) => Uint8Array;
}>;

/**
 * Internal components used by the generator.
 */
export type GeneratorComponents = Readonly<{
  /** Detected runtime environment */
  runtime: RuntimeEnvironment;

  /** 3-byte machine identifier component */
  machineId: Readonly<Uint8Array>;

  /** 16-bit process identifier component */
  pid: number;

  /** Random seed for counter initialization */
  randomSeed: number;
}>;

/**
 * XID generator functions.
 */
export type Generator = Readonly<{
  /** Creates a new XID using the current timestamp or a provided date */
  newId: (datetime?: Date) => XID;

  /** Creates a new ID directly as a string (more efficient) */
  fastId: () => string;

  /** Returns information about the generator's components */
  info: () => Readonly<{
    runtime: RuntimeEnvironment;
    machineId: Readonly<Uint8Array>;
    pid: number;
  }>;
}>;

// ============================================================================
// Generator Factory
// ============================================================================

/**
 * Creates a new XID generator with the provided components.
 *
 * This factory function creates a generator that maintains an atomic counter
 * for ensuring ID uniqueness while exposing a pure functional API.
 *
 * @param components - The components required for ID generation
 * @returns A generator object with functions for creating XIDs
 */
function createGenerator(components: GeneratorComponents): Generator {
  // Thread-safe counter using SharedArrayBuffer and Atomics
  // This is our controlled state cell - the only stateful component
  const counterBuffer = new SharedArrayBuffer(4);
  const atomicCounter = new Uint32Array(counterBuffer);

  // Initialize counter with the random seed
  atomicCounter[0] = components.randomSeed;

  /**
   * Retrieves and increments the counter atomically.
   */
  function getAtomicCounter(): number {
    const curr: number = Atomics.add(atomicCounter, 0, 1);

    // With a 32-bit counter, wrapping is rare but we handle it
    if (curr === 0) {
      atomicCounter[0] = (components.randomSeed * Math.random()) & 0xffff;
    }

    return curr & 0xffffff;
  }

  /**
   * Creates the raw 12-byte ID buffer with the appropriate components.
   */
  function createIdBytes(timestamp: number): Uint8Array {
    // Convert to seconds for the ID (XID spec uses seconds, not milliseconds)
    timestamp = Math.floor(timestamp / 1000);

    const id = new Uint8Array(RAW_LEN);

    // Timestamp (4 bytes, big endian)
    id[0] = (timestamp >> 24) & BYTE_MASK;
    id[1] = (timestamp >> 16) & BYTE_MASK;
    id[2] = (timestamp >> 8) & BYTE_MASK;
    id[3] = timestamp & BYTE_MASK;

    // Machine ID (3 bytes)
    id[4] = components.machineId[0] & BYTE_MASK;
    id[5] = components.machineId[1] & BYTE_MASK;
    id[6] = components.machineId[2] & BYTE_MASK;

    // Process ID (2 bytes, big endian)
    id[7] = (components.pid >> 8) & BYTE_MASK;
    id[8] = components.pid & BYTE_MASK;

    // Counter (3 bytes, big endian)
    const currentCounter = getAtomicCounter();
    id[9] = (currentCounter >> 16) & BYTE_MASK;
    id[10] = (currentCounter >> 8) & BYTE_MASK;
    id[11] = currentCounter & BYTE_MASK;

    return id;
  }

  // Public API - pure functions that insulate callers from internal state
  return Object.freeze({
    newId: (datetime?: Date): XID => {
      const timestamp = datetime instanceof Date ? +datetime : Date.now();
      return createXID(createIdBytes(timestamp));
    },

    fastId: (): string => {
      const timestamp = Date.now();
      return encode(createIdBytes(timestamp) as XID);
    },

    info: () => ({
      runtime: components.runtime,
      machineId: components.machineId,
      pid: components.pid,
    }),
  });
}

// ============================================================================
// Component Factory
// ============================================================================

/**
 * Factory for creating generator components from environmental capabilities.
 */
export const ComponentFactory = {
  /**
   * Creates generator components for the specified environment with optional customizations.
   */
  async create(
    environment: Environment.Container,
    options: GeneratorOptions = {}
  ): Promise<GeneratorComponents> {
    let { randomBytes, hash, machineId, processId } = environment;

    // Apply custom machine ID if provided
    if (typeof options.machineId === 'string') {
      machineId = options.machineId;
    }
    // Use first 3 bytes of machineId hash
    const machineIdBytes = new Uint8Array((await hash(machineId)).subarray(0, 3));

    // Apply custom process ID if provided
    if (typeof options.processId === 'number') {
      processId = options.processId;
    }
    processId = processId & 0xffff;

    // Apply custom random source if provided
    if (options.randomSource) {
      const userInput = validateRandomBytesFunction(options.randomSource);
      if (userInput.isOk()) {
        randomBytes = userInput.unwrap().bind(userInput);
      }
    }

    // Generate a robust random seed for the counter
    const b1 = randomBytes(3);
    const b2 = randomBytes(3);
    const b3 = randomBytes(3);
    const randomSeed = (b1[0] << 16) | (b2[1] << 8) | b3[2];

    return Object.freeze({
      runtime: environment.runtime,
      machineId: machineIdBytes,
      pid: processId,
      randomSeed,
    });
  },
};

// ============================================================================
// Public Factory Functions
// ============================================================================

/**
 * Creates a new XID generator with environment-specific settings.
 *
 * This factory function automatically detects the runtime environment and
 * creates an appropriate generator with platform-specific optimizations.
 *
 * @param options - Optional configuration for customizing the generator
 * @returns A Promise that resolves to a new Generator instance
 */
export async function createXIDGenerator(options: GeneratorOptions = {}): Promise<Generator> {
  const environment = await Environment.setup();
  const components = await ComponentFactory.create(environment, options);
  return createGenerator(components);
}
