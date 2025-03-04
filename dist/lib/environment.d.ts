import { RandomSource } from './types';
/**
 * Create a secure random source based on the available environment
 * @throws RandomSourceUnavailableError if secure random generation is unavailable
 */
export declare function createRandomSource(allowInsecureFallback?: boolean): RandomSource;
/**
 * Generate a machine identifier
 * @param random Random source function
 * @returns 3-byte machine identifier
 */
export declare function generateMachineId(random: RandomSource): Uint8Array;
/**
 * Generate a process ID
 * @param random Random source function
 * @returns 16-bit process identifier
 */
export declare function generateProcessId(random: RandomSource): number;
