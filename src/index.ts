/**
 * NeXID - A TypeScript implementation of globally unique, lexicographically sortable identifiers
 *
 * This module provides the main entry point for using the NeXID library. It exports
 * both a default object with common functionality and named exports for more advanced usage.
 *
 * NeXID generates identifiers that are:
 * - Globally unique across distributed systems without coordination
 * - Lexicographically sortable (sort naturally in databases and indexes)
 * - Chronologically sortable (timestamp is the first component)
 * - URL-safe (using only alphanumeric characters)
 * - Compact (20 characters vs 36 for UUID)
 *
 * Each ID consists of 12 bytes (96 bits) with the following structure:
 * - 4 bytes: timestamp (seconds since Unix epoch)
 * - 3 bytes: machine ID (from hostname or fingerprinting)
 * - 2 bytes: process ID (from process.pid or random)
 * - 3 bytes: counter (increments for each ID)
 *
 * @module nexid
 */

import { XID } from './core/xid';
import { CustomGeneratorOptions, XIDGenerator } from './core/xid-generator';

// ============================================================================
// Initialization
// ============================================================================

/**
 * Lazy-loaded singleton generator instance.
 * Created on first use to avoid unnecessary initialization and improve startup time.
 * @private
 */
let generator: XIDGenerator;

/**
 * Initializes and returns the global XID generator.
 * Will reuse an existing instance if already initialized to avoid redundant setup.
 *
 * @returns A Promise that resolves to the global XID generator
 * @private
 */
async function getGenerator(): Promise<XIDGenerator> {
  if (!generator) {
    generator = await XIDGenerator.build();
  }
  return generator;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Main NeXID object providing core functionality in a convenient package.
 * This is the primary API that most users will interact with for creating
 * and managing XIDs across browser and Node.js environments.
 */
const NeXID = {
  /**
   * Initializes and returns the global ID generator.
   * Must be called at least once before using newId().
   *
   * @returns A Promise that resolves when initialization is complete
   * @example
   * ```typescript
   * // Initialize NeXID before generating IDs
   * await NeXID.init();
   *
   * // Now you can generate IDs
   * const id = NeXID.newId();
   * ```
   */
  init: getGenerator,

  /**
   * Creates a new ID using the global generator.
   * The generator must be initialized first via init().
   *
   * @param [datetime] - Optional Date object to use for the timestamp
   * @returns A Promise that resolves to a new XID
   * @example
   * ```typescript
   * // Initialize once
   * await NeXID.init();
   *
   * // Generate an ID with current timestamp
   * const id = await NeXID.newId();
   * console.log(id.toString());
   *
   * // Generate an ID with a custom timestamp
   * const pastId = await NeXID.newId(new Date('2023-01-01'));
   * ```
   */
  newId: async (datetime?: Date): Promise<XID> => {
    const gen = await getGenerator();
    return gen.newId(datetime);
  },

  /**
   * Generates an ID string directly without creating an XID object.
   * This is more efficient when you only need the string representation.
   * The generator must be initialized first via init().
   *
   * @returns A Promise that resolves to a 20-character string representation of a new ID
   * @example
   * ```typescript
   * // Initialize once
   * await NeXID.init();
   *
   * // Generate an ID string (faster than newId().toString())
   * const idString = await NeXID.fastId();
   * console.log(idString); // e.g. "cbva8hrpns70000ubl70"
   * ```
   */
  fastId: async (): Promise<string> => {
    const gen = await getGenerator();
    return gen.fastId();
  },

  /**
   * Parses a string representation of an XID.
   *
   * @param id - The 20-character string to parse
   * @returns A Result containing the parsed XID or an error
   * @example
   * ```typescript
   * const result = NeXID.fromString('cbva8hrpns70000ubl70');
   * if (result.isOk()) {
   *   const id = result.unwrap();
   *   console.log(id.getTime());
   * } else {
   *   console.error('Invalid ID:', result.unwrapErr());
   * }
   * ```
   */
  fromString: XID.fromString,

  /**
   * Creates an XID from raw bytes.
   *
   * @param bytes - The 12-byte array to create the ID from
   * @returns A Result containing the new XID or an error
   * @example
   * ```typescript
   * const bytes = new Uint8Array(12);
   * // Fill bytes with values...
   *
   * const result = NeXID.fromBytes(bytes);
   * if (result.isOk()) {
   *   const id = result.unwrap();
   *   console.log(id.toString());
   * }
   * ```
   */
  fromBytes: XID.fromBytes,

  /**
   * A nil (zero) ID, useful as a default value or placeholder.
   * @example
   * ```typescript
   * // Use as a default value
   * const id = someResult.unwrapOr(NeXID.nilId);
   *
   * // Check if an ID is nil
   * if (id.equals(NeXID.nilId)) {
   *   console.log('This is a nil ID');
   * }
   * ```
   */
  nilId: new XID(),

  /**
   * Sorts an array of XIDs lexicographically (which also sorts them chronologically).
   *
   * @param ids - Array of XIDs to sort
   * @returns A new sorted array
   * @example
   * ```typescript
   * const sortedIds = NeXID.sortIds([id3, id1, id2]);
   * // Now the IDs are sorted from oldest to newest
   * ```
   */
  sortIds: (ids: XID[]) => ids.sort((a, b) => a.compare(b)),

  /**
   * The XID class for direct usage in advanced scenarios.
   */
  XID,
};

// ============================================================================
// Exports
// ============================================================================

/**
 * Default export providing the main NeXID API.
 * This is the recommended way to use the library for most applications.
 * @example
 * ```typescript
 * import NeXID from 'nexid';
 *
 * async function example() {
 *   await NeXID.init();
 *   const id = await NeXID.newId();
 *   console.log(id.toString());
 * }
 * ```
 */
export default NeXID;

/**
 * Named exports for more advanced usage patterns.
 */
export { XIDGenerator, type CustomGeneratorOptions };

/**
 * Initialize the global generator instance.
 * This function must be called at least once before using NeXID.newId().
 *
 * @returns A Promise that resolves to the initialized generator
 * @example
 * ```typescript
 * import { init, XID } from 'nexid';
 *
 * async function example() {
 *   const generator = await init();
 *   const id = generator.newId();
 *   console.log(id.toString());
 * }
 * ```
 */
export const init: () => Promise<XIDGenerator> = getGenerator;

/**
 * Creates a custom XID generator with specific options.
 * Use this when you need control over the generator components
 * like machine ID, process ID, or random source.
 *
 * @param options - Configuration options for the generator
 * @returns A Promise that resolves to a new XIDGenerator instance
 * @example
 * ```typescript
 * import { createXIDGenerator } from 'nexid';
 *
 * async function example() {
 *   const generator = await createXIDGenerator({
 *     machineId: 'custom-machine-id',
 *     processId: 12345,
 *     randomSource: (size) => {
 *       // Custom random implementation
 *       const bytes = new Uint8Array(size);
 *       // Fill with random values...
 *       return bytes;
 *     }
 *   });
 *
 *   const id = generator.newId();
 *   console.log(id.toString());
 * }
 * ```
 */
export function createXIDGenerator(options?: CustomGeneratorOptions): Promise<XIDGenerator> {
  return XIDGenerator.build(options);
}
