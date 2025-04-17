/**
 * @module nexid/env/registry
 *
 * Environment features registry and resolution system.
 *
 * ARCHITECTURE:
 * This module implements a capability-based environment abstraction layer
 * that enables the library to adapt to different JavaScript runtimes while
 * providing a consistent API. The registry:
 *
 * 1. Defines the core capabilities required by the ID generator
 * 2. Manages the validation and fallback mechanisms for these capabilities
 * 3. Implements a resolution system with caching for performance
 *
 * This abstraction allows the core library code to remain platform-agnostic
 * while still utilizing environment-specific optimizations when available.
 */

import { HashFunctionDefinition } from './features/hash-function/@definition';
import { MachineIdDefinition } from './features/machine-id/@definition';
import { ProcessIdDefinition } from './features/process-id/@definition';
import { RandomBytesDefinition } from './features/random-bytes/@definition';

// ============================================================================
// Types
// ============================================================================
/**
 * Core capabilities required by the XID generator.
 * Each capability is implemented differently based on the runtime environment.
 */
export type FeatureSet = {
  /** Generates cryptographically secure random bytes */
  RandomBytes: (size: number) => Uint8Array;

  /** Creates a cryptographic hash of input data */
  HashFunction: (data: string | Uint8Array) => Promise<Uint8Array>;

  /** Provides a stable machine/device identifier */
  MachineId: () => Promise<string>;

  /** Provides a process-specific identifier */
  ProcessId: () => Promise<number>;
};

export type Feature = keyof FeatureSet;
export type FeatureValidator = (impl: unknown) => Promise<boolean>;

/**
 * Definition of a feature including its validation function and fallback implementation.
 */
export type FeatureDefinition<F extends Feature> = {
  test: FeatureValidator;
  fallback: FeatureSet[F];
};

type Registry = {
  [F in keyof FeatureSet]: FeatureDefinition<F>;
};

// ============================================================================
// Registry
// ============================================================================
/**
 * Global registry of all feature definitions.
 */
export const REGISTRY: Registry = {
  RandomBytes: RandomBytesDefinition,
  HashFunction: HashFunctionDefinition,
  MachineId: MachineIdDefinition,
  ProcessId: ProcessIdDefinition,
};
