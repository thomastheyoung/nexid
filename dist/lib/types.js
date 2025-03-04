"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomSourceUnavailableError = exports.InvalidIDError = void 0;
// ============================================================================
// Errors
// ============================================================================
/**
 * Thrown when attempting to parse an invalid ID
 */
class InvalidIDError extends Error {
    constructor(message = 'Invalid ID') {
        super(message);
        this.name = 'InvalidIDError';
    }
}
exports.InvalidIDError = InvalidIDError;
/**
 * Thrown when a security-critical random generator is unavailable
 * Allows applications to handle this situation appropriately rather than
 * silently falling back to less secure methods
 */
class RandomSourceUnavailableError extends Error {
    constructor(message = 'Secure random source unavailable') {
        super(message);
        this.name = 'RandomSourceUnavailableError';
    }
}
exports.RandomSourceUnavailableError = RandomSourceUnavailableError;
