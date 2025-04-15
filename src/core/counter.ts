/**
 * @module nexid/core/counter
 *
 * Provides a cross-environment atomic counter for thread-safe ID generation.
 *
 * ARCHITECTURE:
 * Prioritizes the best available mechanism for atomic operations:
 * 1. SharedArrayBuffer (native, most performant)
 * 2. WebAssembly Shared Memory (fallback where SAB is unavailable but WASM is)
 * 3. ArrayBuffer (non-atomic fallback for single-threaded environments)
 *
 * Ensures the counter value used in XIDs conforms to the 24-bit requirement
 * via masking, handling wrap-around implicitly.
 */

import { CounterValue } from 'nexid/types/xid';

/**
 * Thread-safe counter interface for generating unique, monotonically
 * increasing values suitable for the counter part of an XID.
 */
export interface AtomicCounter {
  /**
   * Gets the next unique counter value, masked to 24 bits.
   *
   * @returns A unique counter value (0 to 16,777,215)
   */
  getNext(): CounterValue;
}

/**
 * Tries to create and verify a SharedArrayBuffer.
 * Verifies basic atomic operation support as a sanity check.
 *
 * @returns A SharedArrayBuffer if successful and supported, otherwise null.
 */
function trySharedArrayBuffer(): SharedArrayBuffer | null {
  if (!globalThis.SharedArrayBuffer) {
    return null;
  }
  try {
    const buffer = new SharedArrayBuffer(4);
    // Verify Atomics work - primarily a safeguard against unusual environments.
    Atomics.add(new Uint32Array(buffer), 0, 0);
    return buffer;
  } catch (e) {
    console.warn('NeXID: SharedArrayBuffer availability check failed.', e);
    return null;
  }
}

/**
 * Tries to create and verify WebAssembly shared memory.
 * Checks for both WASM Memory support and atomic operation compatibility on it.
 *
 * @returns An ArrayBuffer backed by WASM shared memory if successful and supported, otherwise null.
 */
function tryWasmSharedMemory(): ArrayBuffer | null {
  if (!(globalThis.WebAssembly && globalThis.WebAssembly.Memory)) {
    return null;
  }
  try {
    // Attempt to create shared WASM memory.
    // Using maximum: 1 page prevents potential overallocation if not needed elsewhere.
    const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
    const buffer = memory.buffer;
    // Crucially, verify Atomics work on *this specific* WASM buffer implementation,
    // as support can vary even if WebAssembly.Memory({shared:true}) succeeds.
    Atomics.add(new Uint32Array(buffer), 0, 0);
    return buffer;
  } catch (e) {
    // Catches errors from WebAssembly.Memory constructor (e.g., shared:true unsupported)
    // or Atomics failures on the created WASM buffer.
    console.warn('NeXID: WebAssembly shared memory availability check failed.', e);
    return null;
  }
}

/**
 * Creates an atomic counter instance, automatically selecting the best available
 * underlying buffer type for atomic operations based on environment capabilities.
 *
 * @param seed - Initial value for the internal 32-bit counter.
 * @returns An AtomicCounter instance.
 */
export function createAtomicCounter(seed: number): AtomicCounter {
  // Attempt strategies in order of preference: SAB -> WASM Shared -> ArrayBuffer fallback.
  const buffer = trySharedArrayBuffer() ?? tryWasmSharedMemory() ?? new ArrayBuffer(4);

  // Provide a warning if we had to fall back to the non-thread-safe option,
  // as this indicates potential issues in multi-threaded scenarios.
  const couldHaveUsedSharedMemory =
    globalThis.SharedArrayBuffer || (globalThis.WebAssembly && globalThis.WebAssembly.Memory);
  if (buffer.constructor === ArrayBuffer && couldHaveUsedSharedMemory) {
    console.warn(
      'NeXID: Could not initialize shared memory, falling back to ArrayBuffer. Atomicity is NOT guaranteed across threads/workers.'
    );
  }

  const counter = new Uint32Array(buffer);
  counter[0] = seed;

  return {
    getNext(): CounterValue {
      // 1. Atomically increments the 32-bit value at index 0 by 1.
      // 2. Returns the value *before* the increment occurred.
      const beforeIncrement = Atomics.add(counter, 0, 1);

      // 3. Applies a bitwise AND mask (0xffffff) to the value.
      //    This effectively keeps only the lower 24 bits.
      // 4. Casts the result to CounterValue (which should be number or a type alias for number).
      //    This correctly handles the wrap-around:
      //    - If beforeIncrement was 0xFFFFFF, it returns 0xFFFFFF.
      //    - If beforeIncrement was 0x1000000 (after wrapping), it returns 0.
      //    - If beforeIncrement was 0x1000001, it returns 1.
      return (beforeIncrement & 0xffffff) as CounterValue;
    },
  };
}
