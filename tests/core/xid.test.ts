import { describe, expect, it } from 'vitest';
import { RAW_LEN } from '../../src/core/encoding';
import { XID } from '../../src/core/xid';

describe('XID', () => {
  // Test data: Known sample XIDs with their components
  const sampleXIDs = [
    {
      bytes: new Uint8Array([
        0x4d, 0x88, 0xe1, 0x5b, 0x60, 0xf4, 0x86, 0xe4, 0x28, 0x41, 0x2d, 0xc9,
      ]),
      string: '9m4e2mr0ui3e8a215n4g',
      timestamp: 1300816219,
      machine: new Uint8Array([0x60, 0xf4, 0x86]),
      pid: 0xe428,
      counter: 4271561,
    },
    {
      bytes: new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
      string: '00000000000000000000',
      timestamp: 0,
      machine: new Uint8Array([0x00, 0x00, 0x00]),
      pid: 0x0000,
      counter: 0,
    },
    {
      bytes: new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0x00, 0x00, 0x00,
      ]),
      string: '0000005anf6drrg00000',
      timestamp: 0,
      machine: new Uint8Array([0xaa, 0xbb, 0xcc]),
      pid: 0xddee,
      counter: 0,
    },
  ];

  describe('constructor', () => {
    it('creates a nil ID when no bytes are provided', () => {
      const id = new XID();
      expect(id.isNil()).toBe(true);
    });

    it('creates an ID from valid bytes', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const id = new XID(bytes);
      expect(id.toString()).not.toBe('000000000000000000000');
      expect(id.isNil()).toBe(false);
    });

    it('throws error when invalid bytes are provided', () => {
      const invalidBytes = new Uint8Array([1, 2, 3]);
      expect(() => new XID(invalidBytes)).toThrow(`ID must be exactly ${RAW_LEN} bytes`);
    });
  });

  describe('component extraction', () => {
    it('extracts correct timestamp from IDs', () => {
      sampleXIDs.forEach((sample) => {
        const id = new XID(sample.bytes);
        expect(id.getTime().getTime()).toBe(sample.timestamp * 1000);
      });
    });

    it('extracts correct machine ID from IDs', () => {
      sampleXIDs.forEach((sample) => {
        const id = new XID(sample.bytes);
        const machineId = id.getMachineId();
        expect(Array.from(machineId)).toEqual(Array.from(sample.machine));
      });
    });

    it('extracts correct process ID from IDs', () => {
      sampleXIDs.forEach((sample) => {
        const id = new XID(sample.bytes);
        expect(id.getProcessId()).toBe(sample.pid);
      });
    });

    it('extracts correct counter from IDs', () => {
      sampleXIDs.forEach((sample) => {
        const id = new XID(sample.bytes);
        expect(id.getCounter()).toBe(sample.counter);
      });
    });
  });

  describe('encoding and decoding', () => {
    it('generates correct string representation', () => {
      sampleXIDs.forEach((sample, index) => {
        const id = new XID(sample.bytes);
        const result = id.toString();

        // Log expected and actual byte values for debugging
        console.log(`\nTest case ${index}:`);
        console.log(
          `Bytes: [${Array.from(sample.bytes)
            .map((b) => '0x' + b.toString(16).padStart(2, '0'))
            .join(', ')}]`
        );
        console.log(`Expected: ${sample.string}`);
        console.log(`Actual: ${result}`);

        expect(result).toBe(sample.string);
      });
    });

    it('parses correct ID from string', () => {
      sampleXIDs.forEach((sample) => {
        const result = XID.fromString(sample.string);
        expect(result.isOk()).toBe(true);

        const id = result.unwrap();
        // Compare each byte to the original
        const originalBytes = Array.from(sample.bytes);
        const parsedBytes = Array.from(id.toBytes());
        expect(parsedBytes).toEqual(originalBytes);
      });
    });

    it('returns error for invalid strings', () => {
      const invalidStrings = [
        '', // Empty string
        '12345', // Too short
        '9M4E2MR0UI3E8A215N4G', // Uppercase letters (invalid characters)
        '9m4e2mr0ui3e8a215n4g!', // Invalid character
        'xxxxxxxxxxxxxxxxxxxx', // Invalid characters
        '9m4e2mr0ui3e8a215n4g9m4e2mr0ui3e8a215n4g', // Too long
      ];

      invalidStrings.forEach((str) => {
        const result = XID.fromString(str);
        expect(result.isErr()).toBe(true);
      });
    });
  });

  describe('fromBytes method', () => {
    it('creates correct ID from bytes', () => {
      sampleXIDs.forEach((sample) => {
        const result = XID.fromBytes(sample.bytes);
        expect(result.isOk()).toBe(true);

        const id = result.unwrap();
        expect(id.toString()).toBe(sample.string);
      });
    });

    it('returns error for invalid byte arrays', () => {
      const invalidBytes = [
        new Uint8Array([]), // Empty
        new Uint8Array([1, 2, 3]), // Too short
        new Uint8Array(Array(20).fill(0)), // Too long
      ];

      invalidBytes.forEach((bytes) => {
        const result = XID.fromBytes(bytes);
        expect(result.isErr()).toBe(true);
      });
    });
  });

  describe('comparison and equality', () => {
    it('compares XIDs correctly', () => {
      // ID with earlier timestamp should be "less than"
      const earlier = new XID(new Uint8Array([0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
      const later = new XID(new Uint8Array([0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

      expect(earlier.compare(later)).toBeLessThan(0);
      expect(later.compare(earlier)).toBeGreaterThan(0);
      expect(earlier.compare(earlier)).toBe(0);
    });

    it('implements equals method correctly', () => {
      const id1 = new XID(sampleXIDs[0].bytes);
      const id2 = new XID(sampleXIDs[0].bytes);
      const id3 = new XID(sampleXIDs[1].bytes);

      // Same content, different objects
      expect(id1.equals(id2)).toBe(true);

      // Same object
      expect(id1.equals(id1)).toBe(true);

      // Different content
      expect(id1.equals(id3)).toBe(false);

      // Different type
      expect(id1.equals('not an XID')).toBe(false);
      expect(id1.equals(null)).toBe(false);
    });
  });

  describe('nil ID', () => {
    it('correctly identifies nil IDs', () => {
      const nilId = new XID();
      const nonNilId = new XID(sampleXIDs[0].bytes);

      expect(nilId.isNil()).toBe(true);
      expect(nonNilId.isNil()).toBe(false);
    });
  });

  describe('toJSON method', () => {
    it('returns string representation for JSON serialization', () => {
      sampleXIDs.forEach((sample) => {
        const id = new XID(sample.bytes);
        expect(id.toJSON()).toBe(sample.string);

        // Test JSON.stringify behavior
        const obj = { id };
        const jsonString = JSON.stringify(obj);
        expect(jsonString).toBe(`{"id":"${sample.string}"}`);
      });
    });
  });
});
