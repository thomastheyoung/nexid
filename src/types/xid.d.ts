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
 * This technique ensures that even structurally identical types cannot be
 * used interchangeably if they have different brands.
 */
export type Brand<T> = Readonly<T> & { readonly __xid: unique symbol };

/**
 * XID binary representation - a branded 12-byte Uint8Array.
 * This provides compile-time and runtime immutability guarantees.
 */
export type XIDBytes = Brand<Uint8Array & { readonly __length: 12 }>;

/**
 * XID string representation - a branded 20-character string.
 * Ensures only properly formatted XID strings are accepted by functions
 * expecting this type.
 */
export type XIDString = Brand<string & { readonly __length: 20 }>;

/**
 * Type definitions for individual components of an XID.
 */
namespace XIDPart {
  /** Timestamp component type */
  export type Time = Brand<Date>;
  
  /** Machine ID component type - branded 3-byte array */
  export type MachineID = Brand<Uint8Array & { readonly __length: 3 }>;
  
  /** Process ID component type - branded number */
  export type ProcessID = Brand<number>;
  
  /** Counter component type - branded number */
  export type Counter = Brand<number>;
}

/**
 * Type for counter values used in XID generation.
 * This is a branded number to prevent accidental misuse.
 */
export type CounterValue = Brand<number>;
