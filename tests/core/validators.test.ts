import { describe, expect, it } from 'vitest';
import { FeatureDefinition } from '../../src/env/registry';

describe('Validator.randomBytes', async () => {
  const validator: FeatureDefinition<'RandomBytes'> = (
    await import('../../src/env/lib/random-bytes/@definition')
  ).RandomBytesDefinition;

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

    validRandomFunctions.forEach(async (impl) => {
      const result = await validator.test(impl);
      expect(result).toBe(true);

      // Test that the returned function works correctly
      const size = 10;
      const randomBytes = impl(size);

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

    invalidFunctions.forEach(async (impl) => {
      const result = await validator.test(impl);
      expect(result).toBe(false); // Our new validator should detect bad functions at validation time
    });
  });

  it('rejects non-function values', () => {
    const invalidValues = [null, undefined, 123, 'string', [], {}];

    invalidValues.forEach(async (value) => {
      // @ts-ignore - Deliberately testing invalid types
      const result = await validator.test(value);
      expect(result).toBe(false);
    });
  });
});
