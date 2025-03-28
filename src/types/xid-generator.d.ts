/**
 * @module nexid/types/xid-generator
 *
 * XID Generator type definitions.
 *
 * ARCHITECTURE:
 * This module defines the public interface and configuration options for
 * the XID generator. It establishes the contract between the application code
 * and the generator, providing type safety and documentation for the generator's
 * capabilities and configuration options.
 */

import { XID } from 'nexid/core/xid';
import { FeatureSet } from 'nexid/env/registry';

export namespace Generator {
  /**
   * Public API for the XID generator.
   * This interface defines the operations available after initialization.
   */
  export interface API {
    /** The machine ID used by this generator instance (hashed) */
    readonly machineId: string;

    /** The process ID used by this generator instance */
    readonly processId: number;

    /**
     * Generates a new XID with the specified timestamp or current time.
     *
     * @param timestamp - Optional date to use instead of current time
     * @returns A new XID object
     */
    newId(timestamp?: Date): XID;

    /**
     * Generates a new XID string directly, bypassing object creation.
     * This is approximately 30% faster than newId() when only the string
     * representation is needed.
     *
     * @returns A string representation of a new XID
     */
    fastId(): string;
  }

  /**
   * Configuration options for the XID generator.
   * These options allow customizing the generator's behavior.
   */
  export type Options = Partial<{
    /** Custom random bytes source */
    randomBytes: FeatureSet['RandomBytes'];

    /** Custom machine identifier string */
    machineId: string;

    /** Custom process identifier number */
    processId: number;
  }>;
}
