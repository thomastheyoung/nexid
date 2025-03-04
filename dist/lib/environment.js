"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRandomSource = createRandomSource;
exports.generateMachineId = generateMachineId;
exports.generateProcessId = generateProcessId;
const types_1 = require("./types");
/**
 * Create a secure random source based on the available environment
 * @throws RandomSourceUnavailableError if secure random generation is unavailable
 */
function createRandomSource(allowInsecureFallback = false) {
    // Browser crypto
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        return (size) => {
            const buffer = new Uint8Array(size);
            crypto.getRandomValues(buffer);
            return buffer;
        };
    }
    // Node.js crypto
    if (typeof process !== 'undefined' &&
        typeof process.versions === 'object' &&
        process.versions.node) {
        try {
            // Use require instead of dynamic import to avoid async
            // This is safe because we've already checked that we're in Node
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const nodeCrypto = require('crypto');
            return (size) => new Uint8Array(nodeCrypto.randomBytes(size).buffer);
        }
        catch (e) {
            // Fall through to error handling
        }
    }
    // No secure random source available
    if (allowInsecureFallback) {
        console.warn('WARNING: Using insecure random generator. This should not be used for production.');
        return (size) => {
            const buffer = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                // Math.random() is not cryptographically secure
                buffer[i] = Math.floor(Math.random() * 256);
            }
            return buffer;
        };
    }
    throw new types_1.RandomSourceUnavailableError();
}
/**
 * Generate a machine identifier
 * @param random Random source function
 * @returns 3-byte machine identifier
 */
function generateMachineId(random) {
    // Try to use hostname in Node.js environment for better uniqueness
    if (typeof process !== 'undefined' &&
        typeof process.versions === 'object' &&
        process.versions.node) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const os = require('os');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const crypto = require('crypto');
            const hostname = os.hostname();
            if (hostname) {
                const hash = crypto.createHash('sha256').update(hostname).digest();
                // Use first 3 bytes of hostname hash
                return new Uint8Array(hash.subarray(0, 3));
            }
        }
        catch (e) {
            // Fall through to random
        }
    }
    // Default: use random bytes
    return random(3);
}
/**
 * Generate a process ID
 * @param random Random source function
 * @returns 16-bit process identifier
 */
function generateProcessId(random) {
    // Use process.pid in Node.js
    if (typeof process !== 'undefined' && typeof process.pid === 'number') {
        return process.pid & 0xffff; // Use lowest 16 bits
    }
    // Generate random 16-bit ID
    const bytes = random(2);
    return (bytes[0] << 8) | bytes[1];
}
