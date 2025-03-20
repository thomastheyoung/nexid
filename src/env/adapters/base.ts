/**
 * @module nexid/env/adapters/base
 *
 * Functional platform adaptation layer for environment-specific capabilities.
 *
 * This module defines adapter interfaces using a functional approach, enabling
 * consistent capabilities across diverse runtime environments while maximizing
 * flexibility, testability, and composition.
 *
 * ARCHITECTURE:
 * The adapter pattern uses pure function types instead of classes:
 *
 *            ┌───────────────────┐
 *            │    Core Domain    │
 *            └─────────┬─────────┘
 *                      │ uses
 *            ┌─────────▼─────────┐
 *            │ Adapter Interface │
 *            └─────────┬─────────┘
 *                      │ implements
 *        ┌─────────────┴──────────┐
 *  ┌─────▼─────┐  ┌────▼──────┐   │
 *  │   Node    │  │  Browser  │...│
 *  └───────────┘  └───────────┘   │
 *        Platform-specific        │
 *         implementations         │
 *        ┌─────────────────┐      │
 *        │    Fallback     │◄─────┘
 *        └─────────────────┘
 */

import { Result } from '../../types/result';

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
   * @param size - Number of random bytes to generate
   * @returns Uint8Array containing the requested number of random bytes
   */
  export type RandomBytes = (size: number) => Uint8Array;

  /**
   * Function signature for cryptographic hash generation.
   *
   * @param data - The data to hash, either as a string or byte array
   * @returns A Promise that resolves to a Uint8Array containing the hash value
   */
  export type Hash = (data: string | Uint8Array) => Promise<Uint8Array>;

  /**
   * Function signature for retrieving a machine identifier.
   *
   * @returns A Promise that resolves to a Result containing the machine ID or an error
   */
  export type GetMachineId = () => Promise<Result<string>>;

  /**
   * Function signature for retrieving a process identifier.
   *
   * @returns A Promise that resolves to a Result containing the process ID or an error
   */
  export type GetProcessId = () => Promise<Result<number>>;
}

// ============================================================================
// Environment Adapter Interface
// ============================================================================

/**
 * Interface defining the required capabilities for an environment adapter.
 */
export type EnvironmentAdapter = Readonly<{
  /**
   * Generates random bytes using the best available method for the environment.
   */
  randomBytes: Adapter.RandomBytes;

  /**
   * Generates a cryptographic hash of the input data.
   */
  hash: Adapter.Hash;

  /**
   * Retrieves a unique identifier for the current machine or device.
   */
  getMachineId: Adapter.GetMachineId;

  /**
   * Retrieves a unique identifier for the current process.
   */
  getProcessId: Adapter.GetProcessId;
}>;

// ============================================================================
// Adapter Factory Interface
// ============================================================================

/**
 * Factory interface for creating environment adapters.
 * This enables dependency injection and easier testing.
 */
export interface AdapterFactory {
  /**
   * Creates a new environment adapter instance.
   *
   * @returns A promise that resolves to an environment adapter
   */
  create(): Promise<EnvironmentAdapter>;

  /**
   * Detects whether this adapter is compatible with the current environment.
   *
   * @returns True if this adapter can operate in the current environment
   */
  isCompatible(): boolean;
}
