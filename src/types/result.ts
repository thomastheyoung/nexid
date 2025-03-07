/**
 * NeXID Types - Result Pattern Implementation
 *
 * This module implements a robust error handling pattern inspired by Rust's Result and Option types.
 * It provides a type-safe way to represent operations that might succeed, fail, or return no value,
 * encouraging explicit error handling throughout the codebase.
 *
 * The pattern distinguishes between three distinct outcomes:
 * - Ok<T>: A successful operation with a meaningful value
 * - None: A successful operation that intentionally yields no value
 * - Err: A failed operation with an error detail
 *
 * By using this pattern, the library enforces explicit error handling without relying on
 * exceptions, making control flow more predictable and error states more visible.
 *
 * @module nexid/types/result
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Union type representing all possible result variants.
 * This is the primary type used throughout the library for functions
 * that might fail or return no meaningful value.
 */
export type Result<T> = Ok<T> | None | Err;

// ============================================================================
// Result Variant: Ok
// ============================================================================

/**
 * Class representing a successful outcome that contains a value.
 *
 * This class wraps a successful result value and provides methods
 * for safely unwrapping or checking the result type.
 *
 * @template T - The type of the contained value
 */
export class Ok<T> {
  /**
   * Type discriminator for type narrowing.
   * Used in conditional checks to safely narrow the Result type.
   */
  public readonly type: 'ok' = 'ok';

  /**
   * Constructs an Ok instance.
   *
   * @param value - The value that represents a successful outcome
   */
  constructor(public readonly value: T) {}

  /**
   * Type guard to verify if the current instance is of the Ok variant.
   *
   * @returns True, since this instance is always an Ok
   */
  public isOk(): this is Ok<T> {
    return true;
  }

  /**
   * Type guard to check if the result is a None variant.
   *
   * @returns False, as Ok always contains a valid value
   */
  public isNone(): this is None {
    return false;
  }

  /**
   * Type guard to determine if the instance represents an error state.
   *
   * @returns False, since this is not an error
   */
  public isErr(): this is Err {
    return false;
  }

  /**
   * Retrieves the stored value.
   *
   * @returns The contained value
   * @example
   * ```typescript
   * const result = Result.Ok(42);
   * if (result.isOk()) {
   *   const value = result.unwrap(); // Safe since we checked isOk()
   *   console.log(value); // Outputs: 42
   * }
   * ```
   */
  public unwrap(): T {
    return this.value;
  }

  /**
   * Attempts to retrieve an error, which doesn't exist in Ok.
   *
   * @throws Error since there is no error to unwrap
   */
  public unwrapErr(): never {
    throw new Error('Called unwrapErr on Ok');
  }

  /**
   * Returns the contained value, ignoring the fallback.
   *
   * @param fallback - A fallback value that is never used in this context
   * @returns The contained value
   * @example
   * ```typescript
   * const result = Result.Ok(42);
   * const value = result.unwrapOr(0); // Returns 42, ignoring fallback
   * ```
   */
  public unwrapOr(fallback: T): T {
    return this.value;
  }
}

// ============================================================================
// Result Variant: None
// ============================================================================

/**
 * Class representing a successful outcome that intentionally yields no value.
 *
 * This class is designed for situations where an operation completes without error,
 * yet does not produce a meaningful value. Instead of returning null or undefined,
 * it uses a dedicated type to enforce explicit handling of the empty state.
 */
export class None {
  /**
   * Type discriminator for type narrowing.
   */
  public readonly type: 'none' = 'none';

  /**
   * Type guard confirming that this is not an Ok variant.
   *
   * @returns False, as None does not hold a valid value
   */
  public isOk(): this is Ok<never> {
    return false;
  }

  /**
   * Type guard confirming that this instance represents the absence of a value.
   *
   * @returns True, affirming the empty result state
   */
  public isNone(): this is None {
    return true;
  }

  /**
   * Type guard to check if this instance is an error.
   *
   * @returns False, since None does not represent a failure
   */
  public isErr(): this is Err {
    return false;
  }

  /**
   * Attempts to retrieve a value, but always throws since None is intentionally empty.
   *
   * @throws Error Always throws an error, indicating that there is no value to unwrap
   */
  public unwrap(): never {
    throw new Error('Called unwrap on None');
  }

  /**
   * Attempts to retrieve an error, which doesn't exist in None.
   *
   * @throws Error since there is no error to unwrap
   */
  public unwrapErr(): never {
    throw new Error('Called unwrapErr on None');
  }

  /**
   * Provides a fallback value in lieu of a non-existent contained value.
   *
   * @template T - Type of the fallback value
   * @param fallback - The default value to return
   * @returns The fallback value
   * @example
   * ```typescript
   * const result = Result.None();
   * const value = result.unwrapOr(42); // Returns 42 as fallback
   * ```
   */
  public unwrapOr<T>(fallback: T): T {
    return fallback;
  }
}

// ============================================================================
// Result Variant: Err
// ============================================================================

/**
 * Class representing an operation that resulted in an error.
 *
 * Rather than simply returning an error code or message, this class encapsulates
 * the error as a concrete object, allowing for richer error handling strategies
 * and better type safety.
 *
 * @template E - The error type, defaults to Error
 */
export class Err<E = Error> {
  /**
   * Type discriminator for type narrowing.
   */
  public readonly type: 'error' = 'error';

  /**
   * Constructs an Err instance.
   *
   * @param error - The error encountered during an operation
   */
  constructor(public readonly error: E) {}

  /**
   * Type guard confirming that this instance does not represent a valid value.
   *
   * @returns False, since Err does not represent a successful outcome
   */
  public isOk(): this is Ok<never> {
    return false;
  }

  /**
   * Type guard confirming that this instance is not the None variant.
   *
   * @returns False, as Err encapsulates an error rather than an empty result
   */
  public isNone(): this is None {
    return false;
  }

  /**
   * Type guard to verify that this instance represents an error state.
   *
   * @returns True, affirming the error condition
   */
  public isErr(): this is Err {
    return true;
  }

  /**
   * Attempts to retrieve a value, which doesn't exist in Err.
   *
   * @throws Error since there is no value to unwrap
   */
  public unwrap(): never {
    throw new Error('Called unwrap on Err');
  }

  /**
   * Retrieves the encapsulated error.
   *
   * @returns The stored error
   * @example
   * ```typescript
   * const result = Result.Err(new Error('Something went wrong'));
   * if (result.isErr()) {
   *   const error = result.unwrapErr();
   *   console.error(error.message); // Outputs: "Something went wrong"
   * }
   * ```
   */
  public unwrapErr(): E {
    return this.error;
  }

  /**
   * Provides a fallback value in lieu of a successful result.
   *
   * @template T - Type of the fallback value
   * @param fallback - The default value to use when the result is an error
   * @returns The fallback value
   * @example
   * ```typescript
   * const result = Result.Err(new Error('Failed'));
   * const value = result.unwrapOr(42); // Returns 42 as fallback
   * ```
   */
  public unwrapOr<T>(fallback: T): T {
    return fallback;
  }
}

// ============================================================================
// Factory Methods
// ============================================================================

/**
 * A helper object providing factory methods for creating Result instances.
 *
 * This object abstracts the creation of Ok, None, and Err instances,
 * ensuring a consistent and clear interface for generating results.
 */
export const Result = {
  /**
   * Factory method to create an Ok result.
   *
   * @template T - Type of the success value
   * @param value - The value that represents a successful outcome
   * @returns An instance of Ok containing the provided value
   * @example
   * ```typescript
   * const result = Result.Ok(42);
   * ```
   */
  Ok: <T>(value: T): Result<T> => new Ok(value),

  /**
   * Factory method to create a None result.
   * Used when an operation completes successfully but doesn't produce a value.
   *
   * @template T - Type parameter for API consistency
   * @returns An instance of None
   * @example
   * ```typescript
   * const result = Result.None<number>();
   * ```
   */
  None: <T = never>(): Result<T> => new None(),

  /**
   * Factory method to create an Err result.
   *
   * @template T - Type parameter for API consistency
   * @param error - The error encountered during an operation
   * @returns An instance of Err containing the error
   * @example
   * ```typescript
   * const result = Result.Err(new Error('Something went wrong'));
   * ```
   */
  Err: <T = never>(error: unknown): Result<T> =>
    new Err(error instanceof Error ? error : new Error(String(error))),

  /**
   * Utility to handle different result types based on a pattern.
   * This provides a concise way to handle all possible result variants.
   *
   * @template T - Type of the expected value
   * @param value - The Result to process
   * @param pattern - Object containing handler functions for each result type
   * @returns The output of the matched handler function
   * @example
   * ```typescript
   * const result = someFunction();
   * const value = Result.Fallback(result, {
   *   Ok: (value) => value * 2,
   *   None: () => 0,
   *   Err: () => -1
   * });
   * ```
   */
  Fallback: <T>(
    value: Result<T>,
    pattern: { Ok: (value: T) => T; None?: () => T; Err?: () => T }
  ): T => {
    if (pattern.None && value.isNone()) {
      return pattern.None();
    }
    if (pattern.Err && value.isErr()) {
      return pattern.Err();
    }
    return pattern.Ok(value.unwrap());
  },

  // Convert Result<T>.map for chaining operations
  map: <T, U>(result: Result<T>, fn: (value: T) => U): Result<U> => {
    if (result.isOk()) {
      return Result.Ok(fn(result.unwrap()));
    }
    return Result.Err(result.unwrapErr());
  },
};
