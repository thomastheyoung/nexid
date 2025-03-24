/**
 * XID opaque type representing a globally unique, lexicographically sortable ID.
 *
 * This type provides:
 * 1. Nominal typing (cannot pass arbitrary Uint8Arrays as XIDs)
 * 2. Array-like indexed access for performance
 * 3. Runtime immutability guarantees
 *
 * @remarks
 * XIDs should never be modified after creation. A copy-on-read strategy
 * protects against modification of internal data, but direct array indexing
 * is still provided for performance in read operations.
 */

export type Brand<T> = Readonly<T> & { readonly __xid: unique symbol };

export type XIDBytes = Brand<Uint8Array & { readonly __length: 12 }>;
export type XIDString = Brand<string & { readonly __length: 20 }>;

namespace XIDPart {
  export type Time = Brand<Date>;
  export type MachineID = Brand<Uint8Array & { readonly __length: 3 }>;
  export type ProcessID = Brand<number>;
  export type Counter = Brand<number>;
}

export type CounterValue = Brand<number>;
