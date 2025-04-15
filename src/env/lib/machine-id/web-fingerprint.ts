/**
 * @module nexid/env/lib/machine-id/web-fingerprint
 *
 * Browser fingerprinting implementation for machine ID generation.
 *
 * ARCHITECTURE:
 * This module provides a privacy-respecting browser fingerprinting solution
 * for generating stable machine IDs in web environments. It collects various
 * browser characteristics that together can uniquely identify a device while
 * avoiding collection of personally identifiable information.
 *
 * The approach produces a reasonably consistent identifier across browser
 * sessions, which is then cryptographically hashed before use in XIDs.
 *
 * PRIVACY:
 * - No persistent storage is used (no cookies, localStorage, etc.)
 * - No canvas fingerprinting or other invasive techniques
 * - Does not collect personally identifiable information
 * - Only uses available browser APIs that don't require special permissions
 */

/**
 * Generates a pseudo-fingerprint that includes an environment discriminator.
 * This produces a string containing various browser/device characteristics
 * that collectively provide a reasonably stable device identifier.
 *
 * @returns Promise resolving to a string containing fingerprint components
 */
export async function getFingerprint(): Promise<string> {
  const components: string[] = [];

  // Pseudo random salt
  const salt = ((Math.random() * 0xffff) | 0).toString(16).padStart(2, '0');
  const timestamp = Date.now().toString(36);
  components.push(`salt: ${salt}:${timestamp}`);

  // Environment discriminator
  components.push(`env:${detectContext()}`);

  // Navigator-based components.
  if (exists(navigator)) {
    components.push(`ua:${navigator.userAgent || ''}`);
    components.push(`lang:${navigator.language || ''}`);

    if (navigator.languages && Array.isArray(navigator.languages)) {
      components.push(`langs:${navigator.languages.join(',')}`);
    }

    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency) {
      components.push(`cores:${navigator.hardwareConcurrency}`);
    }
    if ('deviceMemory' in navigator && navigator.deviceMemory) {
      components.push(`mem:${navigator.deviceMemory}`);
    }
  }

  // Screen-based components.
  if (exists(screen)) {
    components.push(`colorDepth:${screen.colorDepth}`);
    components.push(`width:${screen.width}`);
    components.push(`height:${screen.height}`);

    if (screen.availWidth) {
      components.push(`availWidth:${screen.availWidth}`);
    }
    if (screen.availHeight) {
      components.push(`availHeight:${screen.availHeight}`);
    }
  }

  // Timezone offset.
  components.push(`tz:${new Date().getTimezoneOffset()}`);

  return components.filter(Boolean).join('||');
}

/**
 * Detects the current JavaScript execution context in a web environment.
 * This helps differentiate between various browser contexts (main thread,
 * workers, etc.) for more accurate fingerprinting.
 *
 * @returns String identifying the execution context
 */
function detectContext(): string {
  // Traditional browser (window & document exist)
  if (exists(window) && exists(document)) {
    return 'browser';
  }
  // Web worker environments (no document, but importScripts is available)
  if (exists(self) && typeof importScripts === 'function') {
    // Check for a service worker context
    if (isInstance(self, ServiceWorkerGlobalScope)) {
      return 'service-worker';
    }
    if (isInstance(self, DedicatedWorkerGlobalScope)) {
      return 'dedicated-worker';
    }
    if (isInstance(self, SharedWorkerGlobalScope)) {
      return 'shared-worker';
    }
    return 'web-worker';
  }
  return 'unknown';
}

/**
 * Type guard to check if an object exists (is not undefined).
 *
 * @param object - The object to check
 * @returns True if the object exists, false otherwise
 */
function exists<T>(object: unknown): object is T {
  return typeof object !== 'undefined';
}

/**
 * Type guard to check if an object is an instance of a specified type.
 *
 * @param object - The object to check
 * @param type - The type to check against
 * @returns True if the object is an instance of the specified type
 */
function isInstance<T>(object: unknown, type: T): object is T {
  return typeof type !== 'undefined' && object instanceof (type as any);
}
