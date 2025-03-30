/**
 * @module nexid
 *
 * NeXID - Entry point and factory functions for XID generation.
 *
 * ARCHITECTURE:
 * This module serves as the public API entry point for the NeXID library,
 * providing initialization functions that automatically configure and set up
 * the XID generator with environment-specific optimizations. The module uses
 * dynamic imports to ensure only the necessary environment-specific code is
 * loaded at runtime.
 */

import { XID } from './core/xid';
import { detectRuntimeEnvironment, RuntimeEnvironment } from './env/lib/detect-runtime';
import { initNeXID } from './types/api';
import { Generator } from './types/xid-generator';

/**
 * Creates an XID generator with the specified options.
 *
 * The generator ensures uniqueness through a combination of timestamp,
 * machine ID, process ID, and atomic counter components. It auto-detects
 * the current environment and uses optimized implementations.
 *
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  const runtime: RuntimeEnvironment | null = detectRuntimeEnvironment();
  if (!runtime) throw new Error('Error while trying to identify environment.');

  console.log(`NeXID: environment detected: ${runtime}`);

  switch (runtime) {
    case RuntimeEnvironment.Browser:
    case RuntimeEnvironment.ServiceWorker:
    case RuntimeEnvironment.WebWorker:
      console.log('NeXID: initializing with Web adapter');
      const webAdapter = await import('./web.js');
      return webAdapter.init(options);

    case RuntimeEnvironment.Deno:
      console.log('NeXID: initializing with Deno adapter');
      const denoAdapter = await import('./deno.js');
      return denoAdapter.init(options);

    default:
      console.log('NeXID: initializing with Node adapter');
      const nodeAdapter = await import('./node.js');
      return nodeAdapter.init(options);
  }
}

export { XID };
export type XIDGenerator = Generator.API;
export const init: initNeXID = createXIDGenerator;
export default { init: createXIDGenerator };
