import { describe, expect, it } from 'vitest';
import { compareBytes, decode, encode, RAW_LEN } from '../../src/core/encoding';

describe('Encoding Functions', () => {
  describe('encode function', () => {
    it('correctly encodes byte arrays to strings', () => {
      const testCases = [
        {
          bytes: new Uint8Array([
            0x4d, 0x88, 0xe1, 0x5b, 0x60, 0xf4, 0x86, 0xe4, 0x28, 0x41, 0x2d, 0xc9,
          ]),
          expected: '9m4e2mr0ui3e8a215n4g',
        },
        {
          bytes: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          expected: '00000000000000000000',
        },
        {
          bytes: new Uint8Array([
            0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
          ]),
          expected: 'vvvvvvvvvvvvvvvvvvvg',
        },
      ];

      testCases.forEach((testCase) => {
        const result = encode(testCase.bytes);
        expect(result).toBe(testCase.expected);
      });
    });

    it('encodes all possible byte values correctly', () => {
      // Test all possible byte values (0-255)
      for (let i = 0; i < 256; i++) {
        // Create a byte array with a single byte
        const bytes = new Uint8Array(RAW_LEN);
        bytes[0] = i;

        // Encode it
        const encoded = encode(bytes);

        // Decode it back
        const decoded = decode(encoded);
        expect(decoded).toEqual(bytes);

        // The first byte should match what we put in
        expect(decoded[0]).toBe(i);
      }
    });
  });

  describe('decode function', () => {
    it('correctly decodes strings to byte arrays', () => {
      const testCases = [
        {
          string: '9m4e2mr0ui3e8a215n4g',
          expected: new Uint8Array([
            0x4d, 0x88, 0xe1, 0x5b, 0x60, 0xf4, 0x86, 0xe4, 0x28, 0x41, 0x2d, 0xc9,
          ]),
        },
        {
          string: '00000000000000000000',
          expected: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        },
      ];

      testCases.forEach((testCase) => {
        const result = decode(testCase.string);
        expect(Array.from(result)).toEqual(Array.from(testCase.expected));
      });
    });

    it('throws error on invalid input length', () => {
      const invalidInputs = [
        '', // Empty
        '12345', // Too short
        '9m4e2mr0ui3e8a215n4g9m4e2mr0ui3e8a215n4g', // Too long
      ];

      invalidInputs.forEach((input) => {
        expect(() => decode(input)).toThrow();
      });
    });

    it('throws error on invalid characters', () => {
      const invalidInputs = [
        '9M4E2MR0UI3E8A215N4G', // Uppercase
        '9m4e2mr0ui3e8a215n4!', // Special character
        'zzzzzzzzzzzzzzzzzzzz', // Character outside base32hex range
        'vvvvvvvvvvvvvvvvvvvv', // str[19] = 'v' ≠ (0xFF << 4) & 0x1F = 0x10 = 'g'
      ];

      invalidInputs.forEach((input) => {
        expect(() => decode(input)).toThrow();
      });
    });

    it('is the inverse of encode for all valid inputs', () => {
      // Create a bunch of random IDs
      for (let i = 0; i < 100; i++) {
        const bytes = new Uint8Array(RAW_LEN);
        for (let j = 0; j < RAW_LEN; j++) {
          bytes[j] = Math.floor(Math.random() * 256);
        }

        // Encode then decode
        const encoded = encode(bytes);
        const decoded = decode(encoded);

        // Should get back the original bytes
        expect(Array.from(decoded)).toEqual(Array.from(bytes));
      }
    });
  });

  describe('compareBytes function', () => {
    it('compares byte arrays correctly', () => {
      const testCases = [
        // Equal arrays
        {
          a: new Uint8Array([1, 2, 3]),
          b: new Uint8Array([1, 2, 3]),
          expected: 0,
        },
        // a < b
        {
          a: new Uint8Array([1, 2, 3]),
          b: new Uint8Array([1, 2, 4]),
          expected: -1,
        },
        // a > b
        {
          a: new Uint8Array([1, 3, 3]),
          b: new Uint8Array([1, 2, 4]),
          expected: 1,
        },
        // Different lengths (not relevant for XIDs but good to test)
        {
          a: new Uint8Array([1, 2]),
          b: new Uint8Array([1, 2, 3]),
          expected: -1,
        },
      ];

      testCases.forEach((testCase) => {
        const result = compareBytes(testCase.a, testCase.b);
        if (testCase.expected === 0) {
          expect(result).toBe(0);
        } else if (testCase.expected < 0) {
          expect(result).toBeLessThan(0);
        } else {
          expect(result).toBeGreaterThan(0);
        }
      });
    });

    it('handles empty arrays', () => {
      const empty = new Uint8Array([]);
      const nonEmpty = new Uint8Array([1, 2, 3]);

      expect(compareBytes(empty, empty)).toBe(0);
      expect(compareBytes(empty, nonEmpty)).toBeLessThan(0);
      expect(compareBytes(nonEmpty, empty)).toBeGreaterThan(0);
    });
  });
});
