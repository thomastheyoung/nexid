/**
 * NeXID Platform - Runtime Environment Detection
 *
 * This module provides detection functionality for identifying the current JavaScript
 * runtime environment using feature detection. It works across the full spectrum of
 * modern JavaScript environments, from browsers to server-side runtimes, and specialized
 * execution contexts like workers and embedded runtimes.
 *
 * Accurate environment detection is crucial for:
 * - Selecting appropriate random number generators (crypto vs Math.random)
 * - Choosing the right APIs for machine/process identification
 * - Handling environment-specific storage mechanisms
 * - Adapting to platform-specific limitations
 *
 * @module nexid/env/env-detect
 */

import { RuntimeEnvironment } from 'nexid/types/platform';
import { Result } from 'nexid/types/result';

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Detects the current JavaScript runtime environment using feature detection.
 *
 * This function determines whether the code is running in:
 * - Node.js: Detected by checking for the 'process' global with Node.js version
 * - Browser: Detected by checking for 'window' and 'document' globals
 * - Deno: Detected by checking for the 'Deno' object in globalThis
 * - Bun: Detected by checking for the 'Bun' object in globalThis
 * - Web Worker: Detected by checking for 'self' and 'importScripts'
 * - Service Worker: Detected by checking for 'self', 'clients', and 'registration'
 * - Edge Runtime: Detected by checking for edge-specific objects
 * - React Native: Detected by checking for React Native-specific properties
 * - Unknown: When none of the above environments are detected
 *
 * @returns A Result containing the detected runtime environment or an error
 * @example
 * ```typescript
 * const runtimeResult = detectRuntimeEnvironment();
 * if (runtimeResult.isOk()) {
 *   const runtime = runtimeResult.unwrap();
 *   console.log(`Running in ${runtime} environment`);
 *
 *   // Use runtime to make environment-specific decisions
 *   if (runtime === RuntimeEnvironment.Browser) {
 *     // Use browser-specific APIs
 *   } else if (runtime === RuntimeEnvironment.Node) {
 *     // Use Node.js-specific APIs
 *   }
 * }
 * ```
 */
export function detectRuntimeEnvironment(): Result<RuntimeEnvironment> {
  try {
    // Check for Node.js environment by looking for process.versions.node
    if (typeof process !== 'undefined' && typeof process?.versions?.node === 'string') {
      // Electron detection (must come before other Node.js checks)
      if (typeof process?.versions?.electron === 'string') {
        // In Electron's renderer process, window is also defined
        return Result.Ok(
          typeof window !== 'undefined' && typeof window?.process === 'object'
            ? RuntimeEnvironment.Electron_Renderer
            : RuntimeEnvironment.Electron
        );
      }

      return Result.Ok(RuntimeEnvironment.Node);
    }

    // Check for Bun runtime
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).Bun !== 'undefined') {
      return Result.Ok(RuntimeEnvironment.Bun);
    }

    // Check for Deno environment
    if (
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as any).Deno?.version?.deno === 'string'
    ) {
      return Result.Ok(RuntimeEnvironment.Deno);
    }

    // Check for Browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return Result.Ok(RuntimeEnvironment.Browser);
    }

    // Check for Web Worker
    if (
      typeof self !== 'undefined' &&
      typeof importScripts === 'function' &&
      typeof (self as any).clients === 'undefined'
    ) {
      return Result.Ok(RuntimeEnvironment.WebWorker);
    }

    // Check for Service Worker
    if (
      typeof self !== 'undefined' &&
      typeof (self as any).clients !== 'undefined' &&
      typeof (self as any).registration !== 'undefined'
    ) {
      return Result.Ok(RuntimeEnvironment.ServiceWorker);
    }

    // Check for Edge Functions/Workers (Cloudflare Workers, Vercel Edge Functions, etc.)
    if (
      typeof self !== 'undefined' &&
      ((typeof (self as any).caches !== 'undefined' && typeof document === 'undefined') ||
        typeof (globalThis as any).__CLOUDFLARE_WORKER__ !== 'undefined' ||
        typeof (globalThis as any).EdgeRuntime === 'string')
    ) {
      return Result.Ok(RuntimeEnvironment.EdgeRuntime);
    }

    // More reliable React Native detection
    if (
      // Check for React Native environment (older, almost deprecated)
      (typeof navigator !== 'undefined' &&
        typeof navigator.product === 'string' &&
        navigator.product === 'ReactNative') ||
      // More reliable check for newer React Native versions
      (typeof global !== 'undefined' &&
        typeof (global as any).__fbBatchedBridgeConfig !== 'undefined') ||
      typeof (globalThis as any).nativeFabricUIManager !== 'undefined'
    ) {
      return Result.Ok(RuntimeEnvironment.ReactNative);
    }

    // None of the known environments are detected
    return Result.None();
  } catch (error) {
    return Result.Err(error);
  }
}
