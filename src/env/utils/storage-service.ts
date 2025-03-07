/**
 * NeXID Utils - Storage Service Implementation
 *
 * This module provides a platform-agnostic storage abstraction that intelligently
 * selects the best available storage mechanism for the current environment. It supports
 * multiple storage backends with graceful fallback:
 *
 * 1. localStorage (browser persistent storage)
 * 2. Cookies (browser persistent storage with size limitations)
 * 3. In-memory storage (non-persistent but always available)
 *
 * The service uses a singleton pattern to ensure consistency across the application
 * and automatically detects feature availability at runtime to choose the optimal
 * storage mechanism. This is particularly useful for machine ID persistence in browser
 * environments where storage APIs may be restricted.
 *
 * @module nexid/env/utils/storage-service
 */

// ============================================================================
// Storage Service Implementation
// ============================================================================

/**
 * A platform-agnostic storage service with automatic fallback mechanisms.
 *
 * This class provides a unified interface for storing and retrieving data
 * across various JavaScript environments, automatically using the best
 * available storage mechanism.
 */
export class StorageService {
  /**
   * Singleton instance of the storage service
   * @private
   */
  private static instance: StorageService;

  /**
   * Currently selected storage method based on runtime feature detection
   * @private
   */
  private storageMethod: 'localStorage' | 'cookie' | 'memory';

  /**
   * In-memory store used when persistent storage is unavailable
   * @private
   */
  private memoryStore: { [key: string]: any };

  /**
   * Gets the singleton instance of the storage service.
   * Creates the instance on first access.
   *
   * @returns The singleton StorageService instance
   * @example
   * ```typescript
   * const storage = StorageService.getInstance();
   * storage.set('my-key', 'my-value');
   * ```
   */
  public static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }

  /**
   * Private constructor that initializes the service and detects available storage mechanisms.
   * This automatically chooses the best available storage method.
   *
   * @private
   */
  private constructor() {
    this.memoryStore = {};
    if (this.isLocalStorageAvailable()) {
      this.storageMethod = 'localStorage';
    } else if (this.isCookieAvailable()) {
      this.storageMethod = 'cookie';
    } else {
      this.storageMethod = 'memory';
    }
  }

  /**
   * Checks if localStorage is available and operational.
   * Tests by attempting to write and read a test value.
   *
   * @returns True if localStorage is available and working, false otherwise
   * @private
   */
  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Checks if cookies can be used in the current environment.
   * Tests by attempting to set and read a test cookie.
   *
   * @returns True if cookies are available and working, false otherwise
   * @private
   */
  private isCookieAvailable(): boolean {
    try {
      if (typeof document === 'undefined' || !document.cookie) return false;
      document.cookie = 'cookietest=1; SameSite=Strict;';
      const ret = document.cookie.indexOf('cookietest=') !== -1;
      // Clean up test cookie.
      document.cookie = 'cookietest=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
      return ret;
    } catch (e) {
      return false;
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Sets a value under the given key using the best available storage.
   * Automatically falls back to alternative storage methods if the preferred method fails.
   *
   * @param key - The key under which to store the value
   * @param value - The value to store
   * @example
   * ```typescript
   * const storage = StorageService.getInstance();
   *
   * // Store a simple value
   * storage.set('username', 'johndoe');
   *
   * // Store a complex object
   * storage.set('user', { id: 123, name: 'John', roles: ['admin', 'user'] });
   * ```
   */
  public set<T>(key: string, value: T): void {
    const stringValue = JSON.stringify(value);
    if (this.storageMethod === 'localStorage') {
      try {
        localStorage.setItem(key, stringValue);
        return;
      } catch (e) {
        // If localStorage fails at runtime, try cookies.
        try {
          this.setCookie(key, stringValue);
          return;
        } catch (e) {
          // Fallback to in-memory storage.
          this.memoryStore[key] = value;
          return;
        }
      }
    } else if (this.storageMethod === 'cookie') {
      try {
        this.setCookie(key, stringValue);
        return;
      } catch (e) {
        this.memoryStore[key] = value;
        return;
      }
    } else {
      this.memoryStore[key] = value;
    }
  }

  /**
   * Retrieves a value stored under the given key.
   * Attempts to retrieve from the current storage method, with fallbacks if necessary.
   *
   * @param key - The key to retrieve
   * @returns The parsed value, or null if not found
   * @example
   * ```typescript
   * const storage = StorageService.getInstance();
   *
   * // Get a stored value
   * const username = storage.get<string>('username');
   * if (username) {
   *   console.log(`Hello, ${username}!`);
   * }
   *
   * // Get a complex object
   * const user = storage.get<{id: number, name: string}>('user');
   * if (user) {
   *   console.log(`User ID: ${user.id}, Name: ${user.name}`);
   * }
   * ```
   */
  public get<T>(key: string): T | null {
    if (this.storageMethod === 'localStorage') {
      try {
        const item = localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : null;
      } catch (e) {
        try {
          return this.getCookie(key) as T;
        } catch (e) {
          return null;
        }
      }
    } else if (this.storageMethod === 'cookie') {
      try {
        return this.getCookie(key) as T;
      } catch (e) {
        return this.memoryStore[key] ?? null;
      }
    } else {
      return this.memoryStore[key] ?? null;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Helper to set a cookie with a default expiry of 1 year.
   *
   * @param key - The key for the cookie
   * @param value - The value to store
   * @param days - Number of days until expiration (default: 365)
   * @throws Error if cookies are not available in the current environment
   * @private
   */
  private setCookie(key: string, value: string, days: number = 365): void {
    if (typeof document === 'undefined') {
      throw new Error('Cookies are not available in this environment.');
    }
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
      value
    )}; expires=${expires}; path=/`;
  }

  /**
   * Helper to retrieve a cookie value by key.
   *
   * @param key - The key of the cookie to retrieve
   * @returns The parsed cookie value
   * @throws Error if cookies are not available in the current environment
   * @private
   */
  private getCookie(key: string): any {
    if (typeof document === 'undefined') {
      throw new Error('Cookies are not available in this environment.');
    }
    const name = encodeURIComponent(key) + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        const value = cookie.substring(name.length);
        return JSON.parse(value);
      }
    }
    return null;
  }
}
