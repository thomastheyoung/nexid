/**
 * NeXID Environment - Browser/Web Adapter Implementation
 *
 * This module provides the browser-specific implementation of the environment adapter.
 * It leverages Web APIs to provide functionality for cryptographic operations,
 * browser fingerprinting, and storage across web environments including standard
 * browsers, web workers, and service workers.
 *
 * The Web adapter uses:
 * - Web Crypto API for secure random generation and hashing
 * - Browser fingerprinting techniques for machine identification
 * - StorageService for persistent data across page reloads
 * - Browser-specific features for environment detection
 *
 * @module nexid/env/adapters/web
 */

import { Result } from 'nexid/types/result';
import { StorageService } from '../utils/storage-service';
import { EnvironmentAdapter } from './base';

// ============================================================================
// Web Adapter Implementation
// ============================================================================

/**
 * Environment adapter for browser and web runtime environments.
 *
 * This adapter provides optimized implementations for web browsers,
 * leveraging browser-specific APIs and security features.
 */
export class WebAdapter implements EnvironmentAdapter {
  /**
   * Storage service for persisting data across page reloads.
   * @private
   */
  private storage = StorageService.getInstance();

  /**
   * Generates cryptographically secure random bytes using Web Crypto API.
   *
   * @param size - Number of random bytes to generate
   * @returns A Uint8Array containing the random bytes
   */
  public randomBytes(size: number): Uint8Array {
    const byteArray = new Uint8Array(size);
    crypto.getRandomValues(byteArray);
    return byteArray;
  }

  /**
   * Generates a SHA-256 hash of the input data using Web Crypto API.
   *
   * @param data - The data to hash, either as a string or byte array
   * @returns A Promise that resolves to a Uint8Array containing the hash
   */
  public async hash(data: string | Uint8Array): Promise<Uint8Array> {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      data = encoder.encode(data);
    }
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(buffer);
  }

  /**
   * Retrieves a unique identifier for the current browser/device.
   * Uses stored ID if available, or generates a new one using browser fingerprinting.
   *
   * @returns A Promise that resolves to a Result containing the machine ID or an error
   */
  public async getMachineId(): Promise<Result<string>> {
    const key = 'nexid:machine-id';
    const storedId = this.storage.get<string>(key);
    if (storedId) {
      return Result.Ok(storedId);
    }

    let machineId: string;
    const fingerprint = await this.getBrowserFingerprint();
    if (fingerprint.isOk()) {
      machineId = fingerprint.unwrap();
      this.storage.set<string>(key, machineId);
      return Result.Ok(machineId);
    }

    return Result.None();
  }

  /**
   * Retrieves or generates a unique process ID for the current browser context.
   * Uses stored ID if available, or generates a random one.
   *
   * @returns A Promise that resolves to a Result containing the process ID
   */
  public async getProcessId(): Promise<Result<number>> {
    const key = 'nexid:process-id';
    const storedId = this.storage.get<number>(key);
    if (storedId) {
      return Result.Ok(storedId);
    }

    const bytes = this.randomBytes(2);
    const pid = (bytes[0] << 8) | bytes[1];
    this.storage.set<number>(key, pid);
    return Result.Ok(pid);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Generates a browser fingerprint-based machine ID.
   * This is a best-effort approach that collects various browser characteristics
   * to create a unique identifier for the current device/browser combination.
   *
   * Privacy note: This implementation uses non-invasive fingerprinting techniques
   * that balance uniqueness with user privacy. It avoids techniques that could
   * be used for cross-site tracking.
   *
   * @returns A Promise that resolves to a Result containing the fingerprint string or an error
   * @private
   */
  private async getBrowserFingerprint(): Promise<Result<string>> {
    try {
      const fingerprint: Array<string | number> = [];

      // Timestamp, timezone and cryptographically secure random number
      // This provides a good base of entropy with time-based variations
      let randomTime = ((): string => {
        // Convert the current timestamp to a base-36 string
        const timeStampPart: string = Date.now().toString(36);
        // Get current timezone offset - helps distinguish geographic regions
        const timezonePart: number = new Date().getTimezoneOffset();
        // Generate a secure random number for additional entropy
        const randomPart: string = this.randomBytes(10).join('');
        // Combine them with a separator
        return `${timeStampPart}~${randomPart}~${timezonePart}`;
      })();
      fingerprint.push(randomTime);

      // Add browser capability fingerprinting
      // These are feature tests that vary between browsers and browser versions
      const capabilities = {
        storage: 'localStorage' in window,
        workers: 'Worker' in window,
        webgl: !!document.createElement('canvas').getContext('webgl'),
        audio: 'AudioContext' in window,
        battery: 'getBattery' in navigator,
        touch: 'ontouchstart' in window,
      };

      // Convert capabilities to binary fingerprint
      fingerprint.push(
        Object.values(capabilities)
          .map((v) => (v ? '1' : '0'))
          .join('')
      );

      // Add rendering engine fingerprint
      // Canvas fingerprinting provides information about graphics hardware/drivers
      if ('document' in globalThis) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('🔒', 0, 0);
          // Only use a small portion of the canvas fingerprint to reduce privacy impact
          fingerprint.push(canvas.toDataURL().slice(-8));
        }
      }

      // Collect frame timing variations (performance entropy)
      // This captures subtle timing differences in rendering performance
      // which vary based on hardware, browser implementation and system load
      if ('requestAnimationFrame' in globalThis) {
        let frameTiming = '';
        await new Promise<void>((resolve) => {
          let lastTime = performance.now();
          const frameCallback = () => {
            const currentTime = performance.now();
            frameTiming += (currentTime - lastTime).toString(36).slice(-2);
            if (frameTiming.length < 6) {
              lastTime = currentTime;
              requestAnimationFrame(frameCallback);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(frameCallback);
        });
        fingerprint.push(frameTiming);
      }

      // Join all fingerprint components with a random separator for additional entropy
      const randomSeparator: string = this.randomBytes(3).join('');
      return Result.Ok(fingerprint.join(randomSeparator));
    } catch (err) {
      return Result.Err(err instanceof Error ? err.message : String(err));
    }
  }
}
