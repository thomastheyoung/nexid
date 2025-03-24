import { detectRuntimeEnvironment, RuntimeEnvironment } from '../lib/detect-runtime';
import { Environment } from '../registry';

/**
 * Detects the environment and loads the appropriate adapter.
 * This function handles the dynamic import of adapter modules based on
 * the detected runtime environment.
 *
 * @returns A Promise that resolves to a Result containing the runtime and adapter
 * @private
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
