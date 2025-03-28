/**
 * @module nexid/env/adapters
 * 
 * Environment detection and adapter resolution.
 * 
 * ARCHITECTURE:
 * This module serves as the bridge between the environment-agnostic core
 * and environment-specific implementations. It:
 * 
 * 1. Detects the current JavaScript runtime environment
 * 2. Dynamically loads the appropriate adapter for that environment
 * 3. Only imports the code necessary for the detected platform
 * 
 * This design ensures minimal bundle size for each target platform while
 * maintaining consistent behavior across environments.
 */

import { detectRuntimeEnvironment, RuntimeEnvironment } from '../lib/detect-runtime';
import { Environment } from '../registry';

/**
 * Detects the environment and loads the appropriate adapter.
 * This function handles the dynamic import of adapter modules based on
 * the detected runtime environment.
 *
 * @returns A Promise that resolves to a tuple of runtime type and environment adapter
 * @throws Error if the environment cannot be identified
 */
export async function getAdapter(): Promise<[RuntimeEnvironment, Environment]> {
  const runtime: RuntimeEnvironment | null = detectRuntimeEnvironment();

  if (runtime) {
    switch (runtime) {
      case RuntimeEnvironment.Browser:
      case RuntimeEnvironment.ServiceWorker:
      case RuntimeEnvironment.WebWorker:
        const { WebAdapter } = await import('./web.js');
        return [runtime, WebAdapter];

      default:
        const { NodeAdapter } = await import('./node.js');
        return [runtime, NodeAdapter];
    }
  }

  throw new Error('Error while trying to identify environment.');
}
