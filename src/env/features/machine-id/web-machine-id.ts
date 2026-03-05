/**
 * @module nexid/env/features/machine-id/web-machine-id
 *
 * Web machine ID with localStorage persistence and fingerprint fallback.
 *
 * ARCHITECTURE:
 * This module provides a stable machine ID for web environments using a
 * two-layer strategy:
 *
 * 1. **localStorage-first**: A crypto-random ID is generated on first use and
 *    persisted in localStorage. This provides high entropy and cross-session
 *    stability, the web equivalent of a persistent system identifier.
 *
 * 2. **Fingerprint fallback**: When localStorage is unavailable (private
 *    browsing, workers, sandboxed iframes), a deterministic fingerprint is
 *    computed from stable browser signals.
 *
 * NOTE: Unlike the node adapter's `getOSMachineId()`, this function never
 * returns null, it always resolves to a usable string. This means the
 * Environment's `@definition.ts` fallback is never reached, and degradation
 * to fingerprint-only mode is silent. This is intentional: even the lowest
 * tier (deterministic fingerprint) provides better stability than the
 * definition fallback's `Math.random()` + `Date.now()`.
 *
 * Service workers have `crypto.randomUUID()` but no `localStorage`, so each
 * activation generates a fresh (unpersisted) UUID. This is acceptable since
 * the other XID components (timestamp, counter, PID) still prevent collisions.
 */

import { getFingerprint } from 'nexid/env/features/machine-id/web-fingerprint';

const STORAGE_KEY = 'nexid:wmid';

/**
 * Returns a stable machine ID for the current browser/device.
 *
 * Tries to read a previously persisted ID from localStorage. On first use,
 * generates a new random ID via `crypto.randomUUID()` and persists it.
 * Falls back to a deterministic fingerprint when storage or crypto APIs
 * are unavailable.
 *
 * @returns A machine identifier string
 */
export function getWebMachineId(): string {
  // Try reading a persisted ID.
  const stored = storageRead();
  if (stored) return stored;

  // Generate a new random ID if crypto.randomUUID is available.
  const id = tryRandomUUID() ?? getFingerprint();

  // Attempt to persist for future sessions.
  storageWrite(id);

  return id;
}

/**
 * Reads the persisted machine ID from localStorage.
 * Returns null if storage is unavailable or the key is absent.
 */
function storageRead(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    // SecurityError in sandboxed iframes, opaque origins, etc.
    return null;
  }
}

/**
 * Writes a machine ID to localStorage.
 * Silently fails when storage is unavailable.
 */
function storageWrite(value: string): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, value);
  } catch {
    // SecurityError or QuotaExceededError — nothing to do.
  }
}

/**
 * Attempts to generate a random UUID via the Web Crypto API.
 * Returns null when the API is unavailable (insecure context, older browsers).
 */
function tryRandomUUID(): string | null {
  try {
    return globalThis.crypto?.randomUUID?.() ?? null;
  } catch {
    // TypeError in insecure contexts (HTTP) where the method exists but is blocked.
    return null;
  }
}
