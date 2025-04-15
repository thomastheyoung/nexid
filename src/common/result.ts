/**
 * @module nexid/common/result
 *
 * Result type implementation for functional error handling.
 *
 * ARCHITECTURE:
 * This module implements a functional Result pattern inspired by Rust and functional
 * programming paradigms. The Result type provides a type-safe way to handle errors
 * without exceptions, supporting three variants:
 *
 * 1. Ok<T> - Represents a successful result with a value
 * 2. None - Represents an absence of a value (like null, but type-safe)
 * 3. Err<E> - Represents an error condition with an error object
 *
 * The implementation uses TypeScript's type system to its fullest to ensure
 * compile-time safety when working with potentially failing operations.
 */

export type Result<T, E extends Error = Error> = Ok<T> | None | Err<E>;
export type AsyncResult<T, E extends Error = Error> = Promise<Ok<T> | None | Err<E>>;

/**
 * Abstract base class for all Result variants.
 * Provides common functionality and type guarantees.
 */
abstract class BaseResult<T, E extends Error = Error> {
  abstract readonly type: 'ok' | 'none' | 'error';

  abstract isOk(): this is Ok<T>;
  abstract isNone(): this is None;
  abstract isErr(): this is Err<E>;

  /**
   * Pattern matching on the Result.
   * The handlers for all three variants must be provided.
   */
  abstract match<U>(handlers: { Ok: (value: T) => U; None: () => U; Err: (error: E) => U }): U;

  /**
   * Transforms the contained value if Ok; passes through None or Err.
   *
   * @param fn - Function to apply to the contained value
   * @returns A new Result with the transformed value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.match({
      Ok: (value) => Result.Ok<U>(fn(value)),
      None: () => Result.None(),
      Err: (err) => Result.Err(err),
    });
  }

  /**
   * Chains another operation that returns a Result.
   *
   * @param fn - Function that takes the current value and returns a new Result
   * @returns The result of applying the function
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return this.match({
      Ok: fn,
      None: () => Result.None(),
      Err: (err) => Result.Err(err),
    });
  }

  abstract unwrap(): T;
  abstract unwrapErr(): E;
  abstract unwrapOr(fallback: T): T;
}

// ---------------------------------------------------------------------------
// Ok Variant
// ---------------------------------------------------------------------------
/**
 * Represents a successful result containing a value.
 */
export class Ok<T> extends BaseResult<T> {
  public readonly type = 'ok' as const;

  constructor(public readonly value: T) {
    super();
  }

  isOk(): this is Ok<T> {
    return true;
  }
  isNone(): this is None {
    return false;
  }
  isErr(): this is Err {
    return false;
  }

  match<U>(handlers: { Ok: (value: T) => U; None: () => U; Err: (error: never) => U }): U {
    return handlers.Ok(this.value);
  }

  /**
   * Extracts the value from the Result.
   * Safe to call on Ok variant.
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Attempts to extract the error from the Result.
   * @throws Error when called on Ok variant
   */
  unwrapErr(): never {
    throw new Error('Called unwrapErr on Ok');
  }

  /**
   * Returns the contained value, ignoring the fallback.
   */
  unwrapOr(_fallback: T): T {
    return this.value;
  }
}

// ---------------------------------------------------------------------------
// None Variant
// ---------------------------------------------------------------------------
/**
 * Represents the absence of a value.
 * Implemented as a singleton for memory efficiency.
 */
export class None extends BaseResult<never> {
  public readonly type = 'none' as const;

  // Singleton instance
  private static _instance: None = new None();

  private constructor() {
    super();
  }

  // Provide a generic static accessor
  static instance(): None {
    return this._instance as None;
  }

  isOk(): this is Ok<never> {
    return false;
  }
  isNone(): this is None {
    return true;
  }
  isErr(): this is Err<never> {
    return false;
  }

  match<U>(handlers: { Ok: (value: never) => U; None: () => U; Err: (error: never) => U }): U {
    return handlers.None();
  }

  /**
   * Attempts to extract a value from None.
   * @throws Error when called on None variant
   */
  unwrap(): never {
    throw new Error('Called unwrap on None');
  }

  /**
   * Attempts to extract an error from None.
   * @throws Error when called on None variant
   */
  unwrapErr(): never {
    throw new Error('Called unwrapErr on None');
  }

  /**
   * Returns the fallback value when called on None.
   */
  unwrapOr<U>(fallback: U): U {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Err Variant
// ---------------------------------------------------------------------------
/**
 * Represents an error condition containing an Error object.
 */
export class Err<E extends Error = Error> extends BaseResult<never, E> {
  public readonly type = 'error' as const;

  constructor(public readonly error: E) {
    super();
  }

  isOk(): this is Ok<never> {
    return false;
  }
  isNone(): this is None {
    return false;
  }
  isErr(): this is Err<E> {
    return true;
  }

  match<U>(handlers: { Ok: (value: never) => U; None: () => U; Err: (error: E) => U }): U {
    return handlers.Err(this.error);
  }

  /**
   * Attempts to extract a value from Error.
   * @throws Error when called on Err variant
   */
  unwrap(): never {
    throw new Error('Called unwrap on Err');
  }

  /**
   * Extracts the error from the Result.
   * Safe to call on Err variant.
   */
  unwrapErr(): E {
    return this.error;
  }

  /**
   * Returns the fallback value when called on Err.
   */
  unwrapOr<U>(fallback: U): U {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------
/**
 * Factory functions for creating Result instances.
 */
export const Result = {
  /**
   * Creates an Ok result containing a value.
   */
  Ok: <T>(value: T): Result<T, never> => new Ok<T>(value),

  /**
   * Creates a None result representing absence of a value.
   */
  None: (): Result<never, never> => None.instance(),

  /**
   * Creates an Err result containing an error.
   * Automatically converts non-Error objects to Error instances.
   */
  Err: <E extends Error = Error>(error: E | unknown): Result<never, E> =>
    new Err<E>(toError<E>(error)),
};

/**
 * Helper function to ensure errors are proper Error instances.
 */
function toError<E extends Error>(error: E | unknown): E {
  return error instanceof Error ? (error as E) : (new Error(String(error)) as E);
}
