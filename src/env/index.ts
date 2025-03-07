/**
 * NeXID Environment - Setup and Initialization
 *
 * This module serves as the main entry point for the environment detection and
 * adapter selection system. It automatically detects the current runtime environment
 * and initializes the appropriate adapter, providing a unified interface for
 * environment-specific operations regardless of where the code is running.
 *
 * Key responsibilities:
 * - Detecting the current JavaScript runtime environment
 * - Loading and initializing the appropriate environment adapter
 * - Providing graceful fallbacks for each capability
 * - Exposing a consistent API for the rest of the library
 *
 * The environment system enables the library to adapt to different JavaScript
 * environments while maintaining consistent behavior and maximizing capabilities
 * based on available platform features.
 *
 * @module nexid/env
 */

import { validateHashFunction, validateRandomBytesFunction } from 'nexid/core/validators';
import { RuntimeEnvironment } from 'nexid/types/platform';
import { Result } from 'nexid/types/result';
import { Adapter, EnvironmentAdapter } from './adapters/base';
import { FallbackAdapter } from './adapters/fallback';
import { detectRuntimeEnvironment } from './env-detect';

// ============================================================================
// Environment Namespace
// ============================================================================

/**
 * Namespace containing environment setup and detection functionality.
 */
export namespace Environment {
  /**
   * Container for environment-specific capabilities.
   * This type represents the unified interface that the rest of the library
   * will use to access environment-specific features.
   */
  export type Container = {
    /** Detected runtime environment */
    runtime: RuntimeEnvironment;
    /** Function for generating secure random bytes */
    randomBytes: Adapter.RandomBytes;
    /** Function for generating cryptographic hashes */
    hash: Adapter.Hash;
    /** Machine identifier for the current system */
    machineId: string;
    /** Process identifier for the current execution context */
    processId: number;
  };

  /**
   * Sets up the environment and initializes the appropriate adapter.
   * This is the main entry point for environment initialization, and should
   * be called before using any environment-specific features.
   *
   * The setup process:
   * 1. Detects the current runtime environment
   * 2. Loads the appropriate adapter for that environment
   * 3. Initializes the adapter and verifies its capabilities
   * 4. Falls back to safer alternatives if specific features are unavailable
   *
   * @returns A Promise that resolves to a Container with all environment capabilities
   */
  export async function setup(): Promise<Container> {
    const fallback = new FallbackAdapter();
    const whichAdapter = await getAdapter();

    if (whichAdapter.isOk()) {
      const [runtime, adapter] = whichAdapter.unwrap();

      let randomBytes = adapter.randomBytes;
      if (validateRandomBytesFunction(randomBytes).isErr()) {
        randomBytes = fallback.randomBytes;
      }

      // Hash function
      let hash = adapter.hash;
      if (validateHashFunction(hash).isErr()) {
        hash = fallback.hash;
      }

      // Get machine ID
      let machineId: string;
      const adapterMachineId = await adapter.getMachineId();
      if (adapterMachineId.isOk()) {
        machineId = adapterMachineId.unwrap();
      } else {
        machineId = (await fallback.getMachineId()).unwrap();
      }

      // Get Process ID
      let processId: number;
      const adapterProcessId = await adapter.getProcessId();
      if (adapterProcessId.isOk()) {
        processId = adapterProcessId.unwrap();
      } else {
        processId = (await fallback.getProcessId()).unwrap();
      }

      return { runtime, randomBytes, hash, machineId, processId };
    }

    // If we haven't found any environment adapter, fallback to manual methods
    return {
      runtime: RuntimeEnvironment.Unknown,
      randomBytes: fallback.randomBytes,
      hash: fallback.hash,
      machineId: (await fallback.getMachineId()).unwrap(),
      processId: (await fallback.getProcessId()).unwrap(),
    };
  }

  /**
   * Detects the environment and loads the appropriate adapter.
   * This function handles the dynamic import of adapter modules based on
   * the detected runtime environment.
   *
   * @returns A Promise that resolves to a Result containing the runtime and adapter
   * @private
   */
  async function getAdapter(): Promise<Result<[RuntimeEnvironment, EnvironmentAdapter]>> {
    const runtime: Result<RuntimeEnvironment> = detectRuntimeEnvironment();

    if (runtime.isOk()) {
      const env = runtime.unwrap();
      let adapter: EnvironmentAdapter | null = null;

      switch (env) {
        case RuntimeEnvironment.Browser:
        case RuntimeEnvironment.ServiceWorker:
        case RuntimeEnvironment.WebWorker:
          const { WebAdapter } = await import('nexid/env/adapters/web.js');
          adapter = new WebAdapter();
          break;

        case RuntimeEnvironment.Deno:
          const { DenoAdapter } = await import('nexid/env/adapters/deno.js');
          adapter = new DenoAdapter();
          break;

        default:
          const { NodeAdapter } = await import('nexid/env/adapters/node.js');
          adapter = new NodeAdapter();
      }

      return Result.Ok([env, adapter]);
    }

    return Result.Err('Error while trying to identify environment.');
  }
}
