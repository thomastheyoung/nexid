/**
 * NeXID Types - Platform Detection Enumerations
 *
 * This module provides strongly-typed enumerations for various platform-specific
 * environments that can be detected at runtime. These enums are used throughout
 * the library to adapt behavior based on the execution environment, enabling
 * consistent ID generation across diverse JavaScript runtimes.
 *
 * Platform detection helps the library choose appropriate:
 * - Random number generators (secure when available)
 * - Storage mechanisms (based on available APIs)
 * - Machine and process identification methods
 *
 * @module nexid/types/platform
 */

// ============================================================================
// Runtime Environments
// ============================================================================

/**
 * Enumeration of various JavaScript runtimes that can be detected.
 *
 * This enum covers the full spectrum of modern JavaScript environments,
 * from traditional (Node.js, browsers) to specialized runtimes (Deno, Bun)
 * and embedded contexts (Electron, React Native).
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

// ============================================================================
// Operating Systems
// ============================================================================

/**
 * Enumeration of operating systems that can be detected.
 *
 * This enum includes all major operating systems supported by Node.js and Deno
 * environments, allowing for OS-specific adaptations when necessary.
 */
export enum OperatingSystem {
  /**
   * Indicates the operating system could not be determined.
   * This is a fallback used when detection fails.
   */
  Unknown = 'unknown',

  /**
   * Microsoft Windows operating system.
   * Detected via process.platform === 'win32'.
   */
  Windows = 'windows',

  /**
   * Apple macOS operating system.
   * Detected via process.platform === 'darwin'.
   */
  MacOS = 'macos',

  /**
   * Linux-based operating systems.
   * Detected via process.platform === 'linux'.
   */
  Linux = 'linux',

  /**
   * FreeBSD Unix-like operating system.
   * Detected via process.platform === 'freebsd'.
   */
  FreeBSD = 'freebsd',

  /**
   * OpenBSD Unix-like operating system.
   * Detected via process.platform === 'openbsd'.
   */
  OpenBSD = 'openbsd',

  /**
   * NetBSD Unix-like operating system.
   * Detected via process.platform === 'netbsd'.
   */
  NetBSD = 'netbsd',

  /**
   * IBM AIX operating system.
   * Detected via process.platform === 'aix'.
   */
  AIX = 'aix',

  /**
   * Oracle SunOS/Solaris operating system.
   * Detected via process.platform === 'sunos'.
   */
  SunOS = 'sunos',

  /**
   * Android mobile operating system.
   * Detected via process.platform === 'android'.
   */
  Android = 'android',

  /**
   * Haiku open-source operating system.
   * Detected via process.platform === 'haiku'.
   */
  Haiku = 'haiku',
}

// ============================================================================
// Container Environments
// ============================================================================

/**
 * Enumeration of container environments that can be detected.
 *
 * This enum covers various containerization technologies like Docker and
 * orchestration platforms like Kubernetes, allowing the library to adapt
 * to containerized deployment environments.
 */
export enum ContainerEnvironment {
  /**
   * Docker container runtime.
   * Detected via /.dockerenv file or container-specific cgroups.
   */
  Docker = 'docker',

  /**
   * Kubernetes container orchestration platform.
   * Detected via specific environment variables or cgroup paths.
   */
  Kubernetes = 'kubernetes',

  /**
   * Amazon Elastic Container Service.
   * Detected via ECS-specific environment variables.
   */
  ECS = 'ecs',

  /**
   * AWS Fargate serverless container compute engine.
   * Detected via Fargate-specific environment variables.
   */
  Fargate = 'fargate',

  /**
   * Google Cloud Run serverless container platform.
   * Detected via Cloud Run-specific environment variables.
   */
  CloudRun = 'cloudrun',
}

// ============================================================================
// Serverless Environments
// ============================================================================

/**
 * Enumeration of serverless environments that can be detected.
 *
 * This enum covers major serverless/Function-as-a-Service platforms,
 * enabling optimizations for short-lived function execution contexts.
 */
export enum ServerlessEnvironment {
  /**
   * Amazon Web Services Lambda.
   * Detected via AWS_LAMBDA_FUNCTION_NAME environment variable.
   */
  AWS = 'aws',

  /**
   * Microsoft Azure Functions.
   * Detected via FUNCTIONS_WORKER_RUNTIME environment variable.
   */
  Azure = 'azure',

  /**
   * Google Cloud Functions.
   * Detected via FUNCTION_NAME environment variable.
   */
  GoogleCloud = 'google_cloud',

  /**
   * Vercel serverless functions/edge runtime.
   * Detected via VERCEL environment variable.
   */
  Vercel = 'vercel',

  /**
   * Netlify Functions serverless environment.
   * Detected via NETLIFY environment variable.
   */
  Netlify = 'netlify',

  /**
   * Edge function runtimes (Cloudflare Workers, etc).
   * Detected via runtime environment checks.
   */
  EdgeRuntime = 'edge_runtime',
}
