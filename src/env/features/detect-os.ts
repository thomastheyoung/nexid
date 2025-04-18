/**
 * @module nexid/env/features/detect-os
 *
 * Operating system detection for server environments.
 *
 * ARCHITECTURE:
 * This module provides functionality to detect the current operating system
 * in Node.js, Deno, Bun, and Electron environments. Accurate OS detection
 * is important for NeXID because different operating systems store machine
 * identifiers in different locations and have different APIs for accessing
 * system information.
 */

import { detectRuntimeEnvironment, RuntimeEnvironment } from './detect-runtime';

/**
 * Enumeration of operating systems that can be detected.
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

/**
 * Detects the current operating system when running in Node.js or similar environments.
 *
 * This function uses platform-specific APIs to identify the OS.
 * The operating system information is used for platform-specific
 * machine ID generation strategies.
 *
 * @returns A Result containing the detected OperatingSystem enum value
 *          or an Error if detection fails or isn't in a supported environment
 */
export function detectOperatingSystem(): OperatingSystem | null {
  try {
    const env = detectRuntimeEnvironment();

    // This function primarily works in Node.js and similar environments
    if (
      env !== RuntimeEnvironment.Node &&
      env !== RuntimeEnvironment.Electron &&
      env !== RuntimeEnvironment.Electron_Renderer &&
      env !== RuntimeEnvironment.Bun &&
      env !== RuntimeEnvironment.Deno
    ) {
      return null;
      // return failure(new Error('Operating system detection requires a Node-like environment'));
    }

    let platform: string;

    // Get platform string based on runtime environment
    if (env === RuntimeEnvironment.Deno) {
      platform = (globalThis as any).Deno.build.os;
    } else {
      // Node.js, Electron, and Bun all expose process.platform
      platform = process.platform;
    }

    // Map the platform string to our OperatingSystem enum
    switch (platform) {
      case 'win32':
        return OperatingSystem.Windows;
      case 'darwin':
        return OperatingSystem.MacOS;
      case 'linux':
        return OperatingSystem.Linux;
      case 'freebsd':
        return OperatingSystem.FreeBSD;
      case 'openbsd':
        return OperatingSystem.OpenBSD;
      case 'aix':
        return OperatingSystem.AIX;
      case 'sunos':
        return OperatingSystem.SunOS;
      case 'android':
        return OperatingSystem.Android;
      case 'haiku':
        return OperatingSystem.Haiku;
      case 'netbsd':
        return OperatingSystem.NetBSD;
      default:
        // Any other platform is considered unknown
        return OperatingSystem.Unknown;
    }
  } catch {}

  return null;
}
