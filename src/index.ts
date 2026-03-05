/**
 * @module nexid
 *
 * NeXID - Entry point and factory functions for XID generation.
 *
 * ARCHITECTURE:
 * This module serves as the universal entry point for the NeXID library.
 * It uses `resolveEnvironment()` to detect the runtime and dynamically
 * import the correct platform adapter, then calls the sync `init`.
 *
 * For sync initialization, use the platform-specific entry points:
 * - nexid/node
 * - nexid/web
 * - nexid/deno
 */

import { XID } from 'nexid/core/xid';
import { type Generator } from 'nexid/types/xid-generator';

import { resolveEnvironment } from './resolve.js';

/**
 * Creates an XID generator with the specified options.
 *
 * Auto-detects the current environment and dynamically imports the
 * matching platform adapter.
 *
 * @param options - Optional configuration parameters
 * @returns Promise resolving to a fully configured XID generator
 */
async function init(options?: Generator.Options): Promise<Generator.API> {
  const env = await resolveEnvironment();
  return env.init(options);
}

export { XID, init, resolveEnvironment };
export { defaultWordFilter, createWordFilter, BLOCKED_WORDS } from './core/word-filter.js';
export type { WordFilterFn } from './core/word-filter.js';
export type { XIDBytes, XIDString } from 'nexid/types/xid';
export type XIDGenerator = Generator.API;
export default { init };
