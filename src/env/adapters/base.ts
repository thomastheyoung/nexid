/**
 * NeXID Environment - Adapter Interfaces
 *
 * This module defines the interfaces and types for platform-specific adapters
 * that provide environment capabilities such as random number generation,
 * hashing, and machine/process identification.
 *
 * The adapter pattern enables the library to:
 * - Abstract away environment-specific implementation details
 * - Provide consistent APIs across different JavaScript runtimes
 * - Switch between implementations based on detected environment
 * - Fall back gracefully when specific capabilities are unavailable
 *
 * Each adapter implements the same interface but uses environment-specific
 * approaches to provide the required functionality.
 *
 * @module nexid/env/adapters/base
 */

import { Result } from 'nexid/types/result';

// ============================================================================
// Adapter Function Types
// ============================================================================

/**
 * Namespace containing type definitions for adapter-provided functions
 */
export namespace Adapter {
  /**
   * Function signature for generating random bytes.
   *
   * This type represents any function that can generate random bytes, particularly
   * cryptographically secure random values when possible. The NeXID library uses
   * this for:
   *
   * 1. Initializing the counter component of XIDs
   * 2. Providing entropy for machine ID generation when hardware IDs are unavailable
   * 3. Generating cryptographically secure values for various internal operations
   *
   * Different environments implement this interface differently:
   * - Node.js: Uses crypto.randomBytes()
   * - Browser: Uses window.crypto.getRandomValues()
   * - Fallback: Uses Math.random() (only when explicitly allowed)
   *
   * @param size - Number of random bytes to generate
   * @returns Uint8Array containing the requested number of random bytes
   */
  export type RandomBytes = (size: number) => Uint8Array;

  /**
   * Function signature for cryptographic hash generation.
   *
   * This type represents any function that can generate a cryptographic hash
   * of input data. The NeXID library uses this for:
   *
   * 1. Converting machine identifiers to fixed-length bytes
   * 2. Creating consistent IDs from variable-length input data
   * 3. Building fingerprints for browser environments
   *
   * @param data - The data to hash, either as a string or byte array
   * @returns A Promise that resolves to a Uint8Array containing the hash value
   */
  export type Hash = (data: string | Uint8Array) => Promise<Uint8Array>;

  /**
   * Function signature for retrieving a machine identifier.
   *
   * This type represents any function that can obtain a unique identifier
   * for the current machine or device. The NeXID library uses this for:
   *
   * 1. Building the machine ID component of XIDs
   * 2. Ensuring uniqueness across different systems
   *
   * @returns A Promise that resolves to a Result containing the machine ID or an error
   */
  export type GetMachineId = () => Promise<Result<string>>;

  /**
   * Function signature for retrieving a process identifier.
   *
   * This type represents any function that can obtain a unique identifier
   * for the current process. The NeXID library uses this for:
   *
   * 1. Building the process ID component of XIDs
   * 2. Ensuring uniqueness across different processes on the same machine
   *
   * @returns A Promise that resolves to a Result containing the process ID or an error
   */
  export type GetProcessId = () => Promise<Result<number>>;
}

// ============================================================================
// Adapter Interface
// ============================================================================

/**
 * Interface that defines the required capabilities for an environment adapter.
 *
 * Each adapter implementation provides environment-specific implementations
 * of these core functions needed for XID generation.
 */
export type EnvironmentAdapter = {
  /**
   * Generates random bytes using the best available method for the environment.
   * Prefers cryptographically secure sources when available.
   */
  randomBytes: Adapter.RandomBytes;

  /**
   * Generates a cryptographic hash of the input data.
   * Used for creating consistent machine IDs from variable-length identifiers.
   */
  hash: Adapter.Hash;

  /**
   * Retrieves a unique identifier for the current machine or device.
   * Uses platform-specific approaches like hostname, MAC address, or fingerprinting.
   */
  getMachineId: Adapter.GetMachineId;

  /**
   * Retrieves a unique identifier for the current process.
   * Uses platform-specific approaches like process.pid or random values for browsers.
   */
  getProcessId: Adapter.GetProcessId;
};
