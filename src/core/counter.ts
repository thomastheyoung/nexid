/**
 * @module nexid/core/counter
 * 
 * Atomic counter implementation for thread-safe ID generation.
 * 
 * ARCHITECTURE:
 * This module provides a cross-environment atomic counter with several
 * key features:
 * 1. Support for SharedArrayBuffer in modern environments
 * 2. Fallback to WebAssembly shared memory where available
 * 3. Last resort fallback to regular ArrayBuffer for basic environments
 * 
 * PERFORMANCE:
 * - Uses native atomic operations for thread safety without locks
 * - Minimal memory overhead with typed arrays
 * - Counter overflow management to prevent duplicate values
 */

import { CounterValue } from 'nexid/types/xid';

/**
 * Thread-safe counter interface for generating unique, monotonically
 * increasing values.
 */
export interface AtomicCounter {
  /**
   * Gets the next unique counter value.
   * 
   * @returns A unique counter value (24-bit integer)
   */
  getNext(): CounterValue;
}

/**
 * Creates an atomic counter with the specified initial seed value.
 * 
 * The implementation automatically selects the most appropriate
 * shared memory mechanism for the current runtime environment.
 * 
 * @param seed - Initial value for the counter
 * @returns A thread-safe atomic counter
 */
export function createAtomicCounter(seed: number): AtomicCounter {
  let buffer: ArrayBuffer;

  if (globalThis.SharedArrayBuffer) {
    buffer = new SharedArrayBuffer(4);
  } else if (globalThis.WebAssembly) {
    buffer = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }).buffer;
    //                                         ╚═ 1 page = 64KiB
  } else {
    buffer = new ArrayBuffer(4);
  }

  const counter = new Uint32Array(buffer);
  counter[0] = seed;

  return {
    getNext(): CounterValue {
      const value = Atomics.add(counter, 0, 1);

      // Handle overflow
      if (value === 0) {
        counter[0] = seed & 0xffff;
      }

      return (value & 0xffffff) as CounterValue;
    },
  };
}
