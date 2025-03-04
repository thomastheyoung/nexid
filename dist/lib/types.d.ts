import { ID } from './nexid';
/**
 * Thrown when attempting to parse an invalid ID
 */
export declare class InvalidIDError extends Error {
    constructor(message?: string);
}
/**
 * Thrown when a security-critical random generator is unavailable
 * Allows applications to handle this situation appropriately rather than
 * silently falling back to less secure methods
 */
export declare class RandomSourceUnavailableError extends Error {
    constructor(message?: string);
}
/**
 * Options for ID generator creation
 */
export interface XidOptions {
    /**
     * Custom random value generator
     * Must return cryptographically secure random values
     */
    randomSource?: RandomSource;
    /**
     * 3-byte machine identifier
     * If not provided, will be generated based on the environment
     */
    machineId?: Uint8Array;
    /**
     * Process identifier (will use lowest 16 bits)
     * Defaults to process.pid in Node.js or a random value
     */
    processId?: number;
    /**
     * Whether to allow fallback to non-cryptographic randomness
     * Default: false for security
     */
    allowInsecureRandomFallback?: boolean;
}
/**
 * Function type for secure random value generation
 */
export type RandomSource = (size: number) => Uint8Array;
/**
 * An XID generator instance
 */
export interface XidGenerator {
    /** Generate a new ID using the current time */
    generate(): ID;
    /** Generate a new ID with a specific timestamp */
    generateWithTime(time: Date): ID;
    /** Parse an ID from its string representation */
    fromString(idStr: string): ID;
    /** Create an ID from raw bytes */
    fromBytes(bytes: Uint8Array): ID;
    /** Create a nil (zero) ID */
    nil(): ID;
}
