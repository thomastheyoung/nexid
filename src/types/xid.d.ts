/**
 * @module nexid/types/xid
 *
 * XID core type definitions.
 *
 * ARCHITECTURE:
 * This module defines the fundamental type-level representation of XIDs
 * using TypeScript's type system. It employs advanced TypeScript techniques
 * like branded types and nominal typing to ensure type safety when working
 * with XIDs, preventing accidental misuse of generic arrays or strings
 * where XIDs are expected.
 */

/**
 * Branded type helper that creates a nominal type from a base type.
 * Uses a string literal tag to ensure structurally identical base types
 * (e.g. two Brand<number> variants) are not interchangeable.
 */
export type Brand<T, Tag extends string> = Readonly<T> & {
  readonly __brand: Tag;
};

/**
 * XID binary representation - a branded 12-byte Uint8Array.
 * This provides compile-time and runtime immutability guarantees.
 */
export type XIDBytes = Brand<Uint8Array & { readonly __length: 12 }, 'XIDBytes'>;

/**
 * XID string representation - a branded 20-character string.
 * Ensures only properly formatted XID strings are accepted by functions
 * expecting this type.
 */
export type XIDString = Brand<string & { readonly __length: 20 }, 'XIDString'>;

/** Branded timestamp extracted from an XID. */
export type XIDTime = Brand<Date, 'XIDTime'>;

/** Branded 3-byte machine identifier extracted from an XID. */
export type XIDMachineID = Brand<Uint8Array & { readonly __length: 3 }, 'XIDMachineID'>;

/** Branded process ID extracted from an XID. */
export type XIDProcessID = Brand<number, 'XIDProcessID'>;

/** Branded counter value extracted from an XID. */
export type XIDCounter = Brand<number, 'XIDCounter'>;

/**
 * Internal counter value used during XID generation (pre-encoding).
 * Distinct from XIDCounter, which is the value extracted from a parsed XID.
 */
export type CounterValue = Brand<number, 'CounterValue'>;
