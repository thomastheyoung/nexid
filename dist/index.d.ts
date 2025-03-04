/**
 * XID - Globally Unique ID Generator
 *
 * A fast, robust, and portable implementation of the XID specification
 * (originally developed by Olivier Poitrey - https://github.com/rs/xid).
 *
 * Features:
 * - Lexicographically sortable: IDs sort naturally in databases and binary searches
 * - Time-ordered: First 4 bytes are timestamp, so IDs sort chronologically
 * - Compact: 20 chars vs 36 for UUID
 * - URL-safe: Uses base32-hex encoding (0-9, a-v)
 * - Universal: Works in any JavaScript environment
 * - Performance: ~3 million IDs/sec
 *
 * Structure (12 bytes total, encoded to 20 chars):
 * - 4 bytes: Unix timestamp (seconds since epoch)
 * - 3 bytes: Machine identifier (derived from hostname or random)
 * - 2 bytes: Process ID (derived from process.pid or random)
 * - 3 bytes: Counter (incremented for each ID, starts random)
 *
 * Usage:
 * ```
 * import * as Xid from 'xid';
 *
 * // Generate a new ID
 * const id = Xid.newId();
 * console.log(id.toString()); // e.g. "cv37m9g5tppgkoc0d42g"
 *
 * // Parse an existing ID
 * const parsed = Xid.fromString("cv37m9g5tppgkoc0d42g");
 * ```
 *
 * @license MIT
 * @packageDocumentation
 */
import { ID } from './lib/nexid';
/**
 * Generate a new ID, optionally with a specific timestamp
 * @param time Optional timestamp to use (defaults to current time)
 */
export declare function newId(time?: Date): ID;
/**
 * Parse an ID from its string representation
 */
export declare function fromString(idStr: string): ID;
/**
 * Create an ID from raw bytes
 */
export declare function fromBytes(bytes: Uint8Array): ID;
/**
 * Get a nil (zero) ID
 */
export declare const nilId: ID;
/**
 * Sort an array of IDs lexicographically
 * Due to the structure of the ID (timestamp first), this also sorts chronologically
 */
export declare function sortIds(ids: ID[]): ID[];
declare const _default: {
    newId: typeof newId;
    fromString: typeof fromString;
    fromBytes: typeof fromBytes;
    nilId: ID;
    sortIds: typeof sortIds;
};
export default _default;
