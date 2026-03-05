/**
 * @module nexid/resolve
 *
 * Async environment resolution for the universal entry point.
 *
 * Detects the current runtime and dynamically imports the matching
 * platform adapter. Use this when you need the two-step pattern:
 *
 *   const { init } = await resolveEnvironment();
 *   const xid = init();
 */

import { detectRuntimeEnvironment, RuntimeEnvironment } from 'nexid/env/features/detect-runtime';
import { type ResolvedEnvironment } from 'nexid/types/api';

export async function resolveEnvironment(): Promise<ResolvedEnvironment> {
  const runtime = detectRuntimeEnvironment();

  switch (runtime) {
    case RuntimeEnvironment.Browser:
    case RuntimeEnvironment.ServiceWorker:
    case RuntimeEnvironment.WebWorker:
      return import('./web.js');
    case RuntimeEnvironment.Deno:
      return import('./deno.js');
    default:
      return import('./node.js');
  }
}
