import { describe, expect, it } from 'vitest';
import { validateRandomBytesFunction } from '../../src/core/validators';

describe('Validator.randomBytes', () => {
  it('accepts valid random byte functions', () => {
    const validRandomFunctions = [
      (size: number) => new Uint8Array(size),
      (size: number) => new Uint8Array(size).fill(42),
      (size: number) => {
        const arr = new Uint8Array(size);
        for (let i = 0; i < size; i++) arr[i] = i % 256;
        return arr;
      },
    ];

    validRandomFunctions.forEach((fn) => {
      const result = validateRandomBytesFunction(fn);
      expect(result.isOk()).toBe(true);

      // Test that the returned function works correctly
      const validatedFn = result.unwrap();
      const size = 10;
      const randomBytes = validatedFn(size);

      expect(randomBytes).toBeInstanceOf(Uint8Array);
      expect(randomBytes.length).toBe(size);
    });
  });

  it('rejects functions that return incorrect types', () => {
    const invalidFunctions = [
      // Returns Array instead of Uint8Array
      (size: number) => Array(size).fill(0),
      // Returns a string
      (size: number) => 'not a byte array',
      // Returns null
      (size: number) => null,
      // Returns undefined
      (size: number) => undefined,
      // Returns a Uint8Array of incorrect size
      (size: number) => new Uint8Array(size + 1),
    ];

    invalidFunctions.forEach((fn) => {
      const result = validateRandomBytesFunction(fn);
      expect(result.isErr()).toBe(true); // Our new validator should detect bad functions at validation time

      // Error message should explain the issue
      expect((result.unwrapErr() as Error).message).toContain('Invalid random source');

      // The function should not be usable
      expect(() => result.unwrap()(5)).toThrow();
    });
  });

  it('rejects non-function values', () => {
    const invalidValues = [null, undefined, 123, 'string', [], {}];

    invalidValues.forEach((value) => {
      // @ts-ignore - Deliberately testing invalid types
      const result = validateRandomBytesFunction(value);
      expect(result.isErr()).toBe(true);
    });
  });
});
