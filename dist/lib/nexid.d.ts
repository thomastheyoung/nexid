/**
 * XID object representing a 12-byte globally unique identifier
 */
export declare class ID {
    private readonly bytes;
    /**
     * Create a new ID from raw bytes
     * @param bytes Optional raw bytes (creates a zero ID if omitted)
     */
    constructor(bytes?: Uint8Array);
    /**
     * Get the timestamp portion of this ID
     */
    getTime(): Date;
    /**
     * Get the 3-byte machine identifier from this ID
     */
    getMachineId(): Uint8Array;
    /**
     * Get the 2-byte process ID from this ID
     */
    getProcessId(): number;
    /**
     * Get the 3-byte counter value from this ID
     */
    getCounter(): number;
    /**
     * Get the raw bytes of this ID
     */
    toBytes(): Uint8Array;
    /**
     * Convert this ID to its string representation
     */
    toString(): string;
    /**
     * Custom JSON serialization
     */
    toJSON(): string;
    /**
     * Compare this ID with another lexicographically
     * Since timestamp is the first component, this also sorts chronologically
     * @returns Negative if this < other, 0 if equal, positive if this > other
     */
    compare(other: ID): number;
    /**
     * Check if this ID equals another
     */
    equals(other: unknown): boolean;
    /**
     * Check if this is a nil (zero) ID
     */
    isNil(): boolean;
}
