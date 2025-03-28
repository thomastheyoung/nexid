/**
 * @module nexid/index-web
 * 
 * NeXID Web browser-specific entry point.
 * 
 * ARCHITECTURE:
 * This module provides a browser-optimized entry point for the NeXID library,
 * pre-configured with the WebAdapter for client environments. This allows
 * for more efficient bundling in browser applications by avoiding the dynamic
 * environment detection process and eliminating Node.js-specific code.
 * 
 * When imported directly, this module uses the WebAdapter without having
 * to detect the environment, providing a small performance benefit during
 * initialization and allowing for more aggressive tree-shaking of server-specific
 * code in bundlers.
 */

import { XID } from './core/xid';
import { XIDGenerator } from './core/xid-generator';
import { WebAdapter } from './env/adapters/web';
import { Generator } from './types/xid-generator';

/**
 * Creates an XID generator with browser-specific optimizations.
 * 
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function createXIDGenerator(options?: Generator.Options): Promise<Generator.API> {
  return XIDGenerator(WebAdapter, options);
}

export { XID };
export const init: () => Promise<Generator.API> = createXIDGenerator;
export default { init: createXIDGenerator };
