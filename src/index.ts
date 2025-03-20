/**
 * @module nexid
 *
 * NeXID - Functional library for globally unique, sortable identifiers.
 *
 * This module provides highly efficient, lexicographically sortable identifiers
 * with a modern functional API, optimized for distributed systems and databases
 * that benefit from naturally ordered unique IDs.
 *
 * CORE CAPABILITIES:
 * - Generate globally unique identifiers that sort chronologically
 * - Create IDs that are URL-safe and compact (20 chars vs 36 for UUIDs)
 * - Work consistently across all JavaScript environments
 * - Provide reliable ordering guarantees for databases
 *
 * ARCHITECTURE:
 * NeXID implements the "functional core, imperative shell" pattern:
 * - Immutable data structures and pure functions form the core API
 * - A thin layer of controlled state manages the atomic counter
 * - Platform adapters abstract environment-specific implementations
 */

import { createXID, fromBytes, fromString, nilXID, XID, xid } from './core/xid';
import { createXIDGenerator, XIDGenerator, XIDGeneratorOptions } from './core/xid-generator';

// ============================================================================
// Singleton Generator Management
// ============================================================================

/**
 * Lazy-loaded singleton generator instance.
 * @private
 */
let generator: XIDGenerator;

/**
 * Initializes and returns the global XID generator.
 *
 * @returns A Promise that resolves to the global XID generator
 * @private
 */
async function getGenerator(): Promise<XIDGenerator> {
  if (!generator) {
    generator = await createXIDGenerator();
  }
  return generator;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Main NeXID object providing core functionality in a convenient package.
 */
const NeXID = {
  /**
   * Initializes and returns the global ID generator.
   *
   * @returns A Promise that resolves when initialization is complete
   */
  init: getGenerator,

  /**
   * Creates a new ID using the global generator.
   *
   * @param [datetime] - Optional Date object to use for the timestamp
   * @returns A Promise that resolves to a new XID
   */
  newId: async (datetime?: Date): Promise<XID> => {
    const gen = await getGenerator();
    return gen.newId(datetime);
  },

  /**
   * Generates an ID string directly without creating an XID object.
   *
   * @returns A Promise that resolves to a 20-character string representation
   */
  fastId: async (): Promise<string> => {
    const gen = await getGenerator();
    return gen.fastId();
  },

  /**
   * Parses a string representation of an XID.
   */
  fromString,

  /**
   * Creates an XID from raw bytes.
   */
  fromBytes,

  /**
   * A nil (zero) ID, useful as a default value or placeholder.
   */
  nilId: nilXID(),

  /**
   * Sorts an array of XIDs lexicographically.
   */
  sortIds: xid.sort,

  /**
   * Function namespace containing all XID operations.
   */
  xid,
};

// ============================================================================
// Exports
// ============================================================================

/**
 * Default export providing the main NeXID API.
 */
export default NeXID;

/**
 * Named exports for more advanced usage patterns.
 */
export { createXID, createXIDGenerator, fromBytes, fromString };
export type { XIDGenerator, XIDGeneratorOptions };

/**
 * Initialize the global generator instance.
 */
export const init: () => Promise<XIDGenerator> = getGenerator;
