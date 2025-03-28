/**
 * @module nexid/env/lib/detect-runtime
 * 
 * JavaScript runtime environment detection.
 * 
 * ARCHITECTURE:
 * This module provides a comprehensive system for detecting the current JavaScript
 * runtime environment. It uses feature detection to identify the execution context
 * across the entire spectrum of modern JavaScript environments, from traditional
 * (Node.js, browsers) to specialized runtimes (Deno, Bun) and embedded contexts
 * (Electron, React Native).
 * 
 * This detection is critical for the NeXID library as it enables environment-specific
 * optimizations for machine ID generation, process ID assignment, and cryptographic
 * operations.
 */

/**
 * Enumeration of various JavaScript runtimes that can be detected.
 */
export enum RuntimeEnvironment {
  /**
   * Indicates the runtime environment could not be determined.
   * This is a fallback used when detection fails.
   */
  Unknown = 'unknown',

  /**
   * Node.js server-side JavaScript runtime.
   * Identified by process.versions.node presence.
   */
  Node = 'node',

  /**
   * Standard web browser environment.
   * Identified by window and document globals.
   */
  Browser = 'browser',

  /**
   * Dedicated browser thread for running JavaScript in parallel.
   * Identified by self and importScripts globals.
   */
  WebWorker = 'webworker',

  /**
   * Special WebWorker that can intercept network requests.
   * Identified by self, clients, and registration globals.
   */
  ServiceWorker = 'serviceworker',

  /**
   * Deno runtime environment (secure TypeScript runtime).
   * Identified by Deno global object.
   */
  Deno = 'deno',

  /**
   * Bun JavaScript runtime (fast Node.js alternative).
   * Identified by Bun global object.
   */
  Bun = 'bun',

  /**
   * React Native mobile application environment.
   * Identified by navigator.product or global.__fbBatchedBridgeConfig.
   */
  ReactNative = 'reactnative',

  /**
   * Electron main process (Node.js based desktop apps).
   * Identified by process.versions.electron without window.
   */
  Electron = 'electron',

  /**
   * Electron renderer process (browser context within Electron).
   * Identified by process.versions.electron with window.
   */
  Electron_Renderer = 'electron_renderer',

  /**
   * Edge functions/workers runtime (e.g. Cloudflare Workers, Vercel Edge).
   * Identified by presence of specific Edge runtime identifiers.
   */
  EdgeRuntime = 'edge_runtime',
}

/**
 * Detects the current JavaScript runtime environment using feature detection.
 * 
 * This function determines the execution context by checking for environment-specific
 * global objects and properties. Each environment provides different APIs for
 * essential operations like random number generation, machine identification,
 * and process tracking.
 *
 * @returns The detected runtime environment enum value
 */
export function detectRuntimeEnvironment(): RuntimeEnvironment {
  // Check for Node.js environment by looking for process.versions.node
  if (typeof process !== 'undefined' && typeof process?.versions?.node === 'string') {
    // Electron detection (must come before other Node.js checks)
    if (typeof process?.versions?.electron === 'string') {
      // In Electron's renderer process, window is also defined
      return typeof window !== 'undefined' && typeof window?.process === 'object'
        ? RuntimeEnvironment.Electron_Renderer
        : RuntimeEnvironment.Electron;
    }

    return RuntimeEnvironment.Node;
  }

  // Check for Bun runtime
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).Bun !== 'undefined') {
    return RuntimeEnvironment.Bun;
  }

  // Check for Deno environment
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).Deno?.version?.deno === 'string'
  ) {
    return RuntimeEnvironment.Deno;
  }

  // Check for Browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return RuntimeEnvironment.Browser;
  }

  // Check for Web Worker
  if (
    typeof self !== 'undefined' &&
    typeof importScripts === 'function' &&
    typeof (self as any).clients === 'undefined'
  ) {
    return RuntimeEnvironment.WebWorker;
  }

  // Check for Service Worker
  if (
    typeof self !== 'undefined' &&
    typeof (self as any).clients !== 'undefined' &&
    typeof (self as any).registration !== 'undefined'
  ) {
    return RuntimeEnvironment.ServiceWorker;
  }

  // Check for Edge Functions/Workers (Cloudflare Workers, Vercel Edge Functions, etc.)
  if (
    typeof self !== 'undefined' &&
    ((typeof (self as any).caches !== 'undefined' && typeof document === 'undefined') ||
      typeof (globalThis as any).__CLOUDFLARE_WORKER__ !== 'undefined' ||
      typeof (globalThis as any).EdgeRuntime === 'string')
  ) {
    return RuntimeEnvironment.EdgeRuntime;
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
    return RuntimeEnvironment.ReactNative;
  }

  // If none of the known environments are detected, return Unknown
  return RuntimeEnvironment.Unknown;
}
