import { Result } from 'nexid/common/result';
import { detectRuntimeEnvironment, RuntimeEnvironment } from './detect-runtime';

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

/**
 * Detects the current operating system when running in Node.js or similar environments.
 *
 * This function uses platform-specific APIs to identify the OS.
 * The operating system information is used for platform-specific
 * machine ID generation strategies.
 *
 * Different operating systems store machine identifiers in different
 * locations, so accurate OS detection helps optimize the machine ID
 * generation process.
 *
 * @returns A Result containing the detected OperatingSystem enum value
 *          or an Error if detection fails or isn't in a supported environment
 */
export function detectOperatingSystem(): Result<OperatingSystem, Error> {
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
      return Result.Err(new Error('Operating system detection requires a Node-like environment'));
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
        return Result.Ok(OperatingSystem.Windows);
      case 'darwin':
        return Result.Ok(OperatingSystem.MacOS);
      case 'linux':
        return Result.Ok(OperatingSystem.Linux);
      case 'freebsd':
        return Result.Ok(OperatingSystem.FreeBSD);
      case 'openbsd':
        return Result.Ok(OperatingSystem.OpenBSD);
      case 'aix':
        return Result.Ok(OperatingSystem.AIX);
      case 'sunos':
        return Result.Ok(OperatingSystem.SunOS);
      case 'android':
        return Result.Ok(OperatingSystem.Android);
      case 'haiku':
        return Result.Ok(OperatingSystem.Haiku);
      case 'netbsd':
        return Result.Ok(OperatingSystem.NetBSD);
      default:
        // Any other platform is considered unknown
        return Result.Ok(OperatingSystem.Unknown);
    }
  } catch (error) {
    // Ensure we always return a proper Error object in the Result
    return Result.Err(error instanceof Error ? error : new Error(String(error)));
  }
}
