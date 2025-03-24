/**
 * NeXID Types - Improved Result Pattern Implementation
 *
 * This version uses an abstract base class to share common functionality,
 * supports a generic error type, includes a singleton for the None variant,
 * and exposes instance methods like match, map, and flatMap.
 */

export type Result<T, E extends Error = Error> = Ok<T> | None | Err<E>;
export type AsyncResult<T, E extends Error = Error> = Promise<Ok<T> | None | Err<E>>;

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

  unwrap(): T {
    return this.value;
  }

  unwrapErr(): never {
    throw new Error('Called unwrapErr on Ok');
  }

  unwrapOr(_fallback: T): T {
    return this.value;
  }
}

// ---------------------------------------------------------------------------
// None Variant
// ---------------------------------------------------------------------------
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

  unwrap(): never {
    throw new Error('Called unwrap on None');
  }
  unwrapErr(): never {
    throw new Error('Called unwrapErr on None');
  }
  unwrapOr<U>(fallback: U): U {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Err Variant
// ---------------------------------------------------------------------------
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

  unwrap(): never {
    throw new Error('Called unwrap on Err');
  }

  unwrapErr(): E {
    return this.error;
  }

  unwrapOr<U>(fallback: U): U {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Factory Functions
// ---------------------------------------------------------------------------
export const Result = {
  Ok: <T>(value: T): Result<T, never> => new Ok<T>(value),
  None: (): Result<never, never> => None.instance(),
  Err: <E extends Error = Error>(error: E | unknown): Result<never, E> =>
    new Err<E>(toError<E>(error)),
};

function toError<E extends Error>(error: E | unknown): E {
  return error instanceof Error ? (error as E) : (new Error(String(error)) as E);
}
