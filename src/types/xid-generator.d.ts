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
import { XIDString } from 'nexid/types/xid';

export namespace Generator {
  /**
   * Public API for the XID generator.
   * This interface defines the operations available after initialization.
   */
  export interface API {
    /** The hashed machine ID bytes used by this generator instance (hex-encoded) */
    readonly machineId: string;

    /** The process ID used by this generator instance */
    readonly processId: number;

    /** True if any security-critical feature is using an insecure fallback */
    readonly degraded: boolean;

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
    fastId(): XIDString;
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

    /**
     * Allow insecure fallbacks for security-critical features.
     * When false (default), initialization throws if CSPRNG
     * cannot be resolved.
     */
    allowInsecure: boolean;

    /**
     * Enable filtering of generated IDs that contain offensive word substrings.
     * When enabled, the generator retries (incrementing the counter) until the
     * filter passes or maxFilterRetries is reached.
     *
     * Uses a curated built-in blocklist of 57 universally offensive English
     * terms that can be formed from the base32-hex alphabet (0-9, a-v).
     *
     * @default false
     */
    filterOffensiveWords: boolean;

    /**
     * Additional offensive words to block alongside the built-in blocklist.
     * Only takes effect when `filterOffensiveWords` is `true`.
     *
     * Words are lowercased and regex-escaped internally. Only words
     * representable in the base32-hex alphabet (0-9, a-v) will ever
     * match generated IDs.
     */
    offensiveWords: string[];

    /**
     * Maximum retry attempts when the offensive word filter rejects an ID.
     * Each retry consumes one counter value. If the budget is exhausted,
     * the last generated ID is returned regardless.
     *
     * Only takes effect when `filterOffensiveWords` is `true`.
     *
     * @default 10
     */
    maxFilterRetries: number;
  }>;
}
