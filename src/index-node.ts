/**
 * @module nexid/index-node
 * 
 * NeXID Node.js-specific entry point.
 * 
 * ARCHITECTURE:
 * This module provides a Node.js-optimized entry point for the NeXID library,
 * pre-configured with the NodeAdapter for server environments. This allows
 * for more efficient bundling in Node.js applications by avoiding the dynamic
 * environment detection process.
 * 
 * When imported directly, this module uses the NodeAdapter without having
 * to detect the environment, providing a small performance benefit during
 * initialization and allowing for more aggressive tree-shaking of browser-specific
 * code in bundlers.
 */

import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { NodeAdapter } from './env/adapters/node';
import { Generator } from './types/xid-generator';

/**
 * Creates an XID generator with Node.js-specific optimizations.
 * 
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  return XIDGenerator(NodeAdapter, options);
}

export { XID };
export const init: () => Promise<Generator.API> = createXIDGenerator;
export default { init: createXIDGenerator };
