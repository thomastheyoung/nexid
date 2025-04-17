/**
 * @module nexid/env/lib/process-id/container-pid
 *
 * Derives a process identifier specifically for containerized environments.
 *
 * ARCHITECTURE:
 * Standard OS process IDs (`process.pid` or `Deno.pid`) are unreliable for
 * distinguishing instances within containers. Multiple containers on the same host
 * might share PID namespaces or have overlapping PIDs, leading to potential
 * collisions if host PIDs were used directly.
 *
 * To provide a more stable and unique identifier *per container instance*, this
 * module attempts to extract an ID string inherent to the container itself.
 * We prioritize common, reliable sources:
 * 1.  `HOSTNAME` env var: Often set to the container ID by runtimes like Docker.
 * 2.  `/proc/self/cpuset` / `/proc/self/cgroup`: These procfs entries typically
 *     contain the container's unique cgroup path, which includes its ID.
 *
 * The extracted identifier (usually a long hex string) is too large for the
 * 2-byte process ID field in an XID, so we take the lower 16 bits (`& 0xffffn`)
 * as a compromise. This preserves a good portion of the container's unique identity
 * while fitting the required format. A fallback to 0 is used if no reliable
 * container ID can be determined.
 *
 * SECURITY:
 * The chosen methods (environment variables, procfs reads) are generally safe
 * within a container, as they access information scoped to the container itself
 * and avoid executing external commands, minimizing security risks.
 */

import { FeatureSet } from 'nexid/env/registry';

/**
 * Provides a container-aware process identifier, masked to 16 bits.
 *
 * This function aims to generate a more stable ID within containers than the
 * host's PID, reducing collision risks across different container instances.
 * It masks the derived ID to fit the 2-byte requirement of the XID format.
 *
 * @returns Promise resolving to a 16-bit numeric ID (0-65535) derived from the
 *          container's identifier, or 0 as a fallback.
 */
export const getProcessId: FeatureSet['ProcessId'] = async (): Promise<number> => {
  const containerIdString = detectContainerId();
  if (containerIdString) {
    try {
      // Ensure it's treated as hex, remove potential '0x' prefix if present
      const cleanedHex = containerIdString.startsWith('0x')
        ? containerIdString.substring(2)
        : containerIdString;

      // Use BigInt for potentially large hex IDs, then mask and convert back to Number
      // Masking ensures the ID fits within the 16 bits allocated in the XID spec.
      const maskedId = BigInt('0x' + cleanedHex) & 0xffffn;
      return Number(maskedId);
    } catch (e) {
      // Handle cases where the detected string isn't valid hex
      console.error(`Failed to parse container ID "${containerIdString}" as hex:`, e);
    }
  }
  // Fallback if no ID detected or parsing failed
  return 0;
};

/**
 * Encapsulates the logic for finding a potential container ID string.
 * It checks multiple sources (env var, procfs) for robustness, as availability
 * can vary between container runtimes and configurations.
 *
 * Note: Uses synchronous file reads for simplicity, assuming this runs during
 * initialization where blocking is acceptable.
 *
 * @returns The detected container ID string (hex), or undefined if none found.
 * @internal
 */
function detectContainerId(): string | undefined {
  // A) Env‑var shortcut: HOSTNAME is a common and easy way container runtimes expose the ID.
  if (
    typeof process !== 'undefined' &&
    typeof process.env === 'object' &&
    process.env.HOSTNAME?.match(/^[0-9a-f]{12,64}$/i) // Match hex string, case-insensitive
  ) {
    return process.env.HOSTNAME;
  }

  // Lazy load file reading function based on environment
  let read: ((path: string) => string) | undefined;
  try {
    // Prefer Deno's built-in sync reader if available
    if (typeof Deno !== 'undefined' && typeof Deno.readTextFileSync === 'function') {
      read = (path: string) => Deno.readTextFileSync(path);
    } else if (typeof require === 'function') {
      // Fallback to Node/Bun's sync reader
      const fs = require('node:fs');
      if (typeof fs.readFileSync === 'function') {
        read = (path: string) => fs.readFileSync(path, 'utf8');
      }
    }
  } catch {} // ignore errors during reader setup (e.g., require not defined, permissions)

  // Proceed only if a reading function is available
  if (!read) return;

  const containerIdRegex = /([0-9a-f]{12,64})/i; // Case-insensitive

  // B) /proc/self/cpuset: Often contains the container ID in its path.
  try {
    const cpuset = read('/proc/self/cpuset').trim();
    const match = cpuset?.match(containerIdRegex);
    return match?.[1];
  } catch {} // ignore errors (e.g. file not found, permissions)

  // C) /proc/self/cgroup: Another common location for the container ID (v1/v2 cgroups).
  try {
    const cgroup = read('/proc/self/cgroup').trim();
    const match = cgroup?.match(containerIdRegex);
    return match?.[1];
  } catch {} // ignore errors

  return undefined; // No suitable ID found
}
