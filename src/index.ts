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
import { XIDGenerator } from './core/xid-generator';
import { getAdapter } from './env/adapters';
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
  const [runtime, adapter] = await getAdapter();
  return XIDGenerator(adapter, options);
}

export { XID };
export const init: () => Promise<Generator.API> = createXIDGenerator;
export default { init: createXIDGenerator };
