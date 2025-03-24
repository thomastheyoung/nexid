import { CounterValue } from 'nexid/types/xid';

export interface AtomicCounter {
  getNext(): CounterValue;
}

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
