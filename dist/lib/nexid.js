"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID = void 0;
const encoding_1 = require("./encoding");
// ============================================================================
// Base class
// ============================================================================
/**
 * XID object representing a 12-byte globally unique identifier
 */
class ID {
    /**
     * Create a new ID from raw bytes
     * @param bytes Optional raw bytes (creates a zero ID if omitted)
     */
    constructor(bytes) {
        if (bytes && bytes.length === encoding_1.RAW_LEN) {
            // Make a copy to prevent external modification
            this.bytes = new Uint8Array(bytes);
        }
        else if (!bytes) {
            // Create a nil ID if no bytes provided
            this.bytes = new Uint8Array(encoding_1.RAW_LEN);
        }
        else {
            throw new Error(`ID must be exactly ${encoding_1.RAW_LEN} bytes`);
        }
    }
    /**
     * Get the timestamp portion of this ID
     */
    getTime() {
        // First 4 bytes contain Unix timestamp (seconds since epoch)
        const seconds = (this.bytes[0] << 24) | (this.bytes[1] << 16) | (this.bytes[2] << 8) | this.bytes[3];
        return new Date(seconds * 1000);
    }
    /**
     * Get the 3-byte machine identifier from this ID
     */
    getMachineId() {
        return this.bytes.slice(4, 7);
    }
    /**
     * Get the 2-byte process ID from this ID
     */
    getProcessId() {
        return (this.bytes[7] << 8) | this.bytes[8];
    }
    /**
     * Get the 3-byte counter value from this ID
     */
    getCounter() {
        return (this.bytes[9] << 16) | (this.bytes[10] << 8) | this.bytes[11];
    }
    /**
     * Get the raw bytes of this ID
     */
    toBytes() {
        // Return a copy to prevent modification
        return new Uint8Array(this.bytes);
    }
    /**
     * Convert this ID to its string representation
     */
    toString() {
        return (0, encoding_1.encode)(this.bytes);
    }
    /**
     * Custom JSON serialization
     */
    toJSON() {
        return this.toString();
    }
    /**
     * Compare this ID with another lexicographically
     * Since timestamp is the first component, this also sorts chronologically
     * @returns Negative if this < other, 0 if equal, positive if this > other
     */
    compare(other) {
        return (0, encoding_1.compareBytes)(this.bytes, other.bytes);
    }
    /**
     * Check if this ID equals another
     */
    equals(other) {
        if (this === other)
            return true;
        if (!(other instanceof ID))
            return false;
        // Compare all bytes
        for (let i = 0; i < encoding_1.RAW_LEN; i++) {
            if (this.bytes[i] !== other.bytes[i]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if this is a nil (zero) ID
     */
    isNil() {
        for (let i = 0; i < encoding_1.RAW_LEN; i++) {
            if (this.bytes[i] !== 0) {
                return false;
            }
        }
        return true;
    }
}
exports.ID = ID;
