"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.nilId = void 0;
exports.newId = newId;
exports.fromString = fromString;
exports.fromBytes = fromBytes;
exports.sortIds = sortIds;
const generator_1 = require("./lib/generator");
const nexid_1 = require("./lib/nexid");
/**
 * Generate a new ID, optionally with a specific timestamp
 * @param time Optional timestamp to use (defaults to current time)
 */
function newId(time) {
    if (time) {
        return (0, generator_1.getDefaultGenerator)().generateWithTime(time);
    }
    return (0, generator_1.getDefaultGenerator)().generate();
}
/**
 * Parse an ID from its string representation
 */
function fromString(idStr) {
    return (0, generator_1.getDefaultGenerator)().fromString(idStr);
}
/**
 * Create an ID from raw bytes
 */
function fromBytes(bytes) {
    return (0, generator_1.getDefaultGenerator)().fromBytes(bytes);
}
/**
 * Get a nil (zero) ID
 */
exports.nilId = new nexid_1.ID();
/**
 * Sort an array of IDs lexicographically
 * Due to the structure of the ID (timestamp first), this also sorts chronologically
 */
function sortIds(ids) {
    return [...ids].sort((a, b) => a.compare(b));
}
exports.default = { newId, fromString, fromBytes, nilId: exports.nilId, sortIds };
