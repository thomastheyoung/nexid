import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { XID } from '../../src/core/xid';
import { XIDGenerator } from '../../src/core/xid-generator';

const MACHINE_ID_SIZE = 3;

describe('XIDGenerator', () => {
  // Set up a default generator for tests
  let generator: XIDGenerator;

  beforeAll(async () => {
    generator = await XIDGenerator.build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('build method', () => {
    it('creates a default generator with valid components', async () => {
      const gen = await XIDGenerator.build();

      // Check machine ID
      expect(gen.machineId).toBeInstanceOf(Uint8Array);
      expect(gen.machineId.length).toBe(MACHINE_ID_SIZE);

      // Check process ID
      expect(typeof gen.pid).toBe('number');
      expect(gen.pid).toBeGreaterThanOrEqual(0);
      expect(gen.pid).toBeLessThanOrEqual(0xffff); // 16-bit value
    });

    it('accepts custom process ID', async () => {
      const customProcessId = 0x1234;
      const gen = await XIDGenerator.build({ processId: customProcessId });

      // Check that the custom process ID was used
      expect(gen.pid).toBe(customProcessId);
    });

    it('accepts custom random source', async () => {
      // Mock random source that returns predictable values
      const mockRandomSource = (size: number): Uint8Array => {
        return new Uint8Array(size).fill(0x42);
      };

      const gen = await XIDGenerator.build({ randomSource: mockRandomSource });

      // Generate an ID and verify the counter part has the expected pattern
      // based on our mock random source
      const id = gen.newId();

      // This is just a smoke test that our random source was used
      // The actual verification of the counter will be in a different test
      expect(id).toBeInstanceOf(XID);
    });

    it('rejects invalid machine ID', async () => {
      // Machine ID that's too short
      // We expect build to still succeed but use a default machine ID instead
      const gen = await XIDGenerator.build({ machineId: '' });

      // The machine ID should not be our invalid one
      expect(gen.machineId.length).toBe(MACHINE_ID_SIZE);
      expect(Array.from(gen.machineId)).not.toEqual([0xaa, 0xbb]);
    });

    it('rejects invalid process ID', async () => {
      // Process ID that's out of 16-bit range
      const invalidProcessId = 0x10000; // 17 bits set

      // We expect build to still succeed but use a default process ID instead
      const gen = await XIDGenerator.build({ processId: invalidProcessId });

      // The process ID should be a 16-bit value, not our invalid one
      expect(gen.pid).toBeLessThanOrEqual(0xffff);
      expect(gen.pid).not.toBe(invalidProcessId);
    });
  });

  describe('newId method', () => {
    it('generates unique IDs', () => {
      const idCount = 1000;
      const ids = new Set<string>();

      for (let i = 0; i < idCount; i++) {
        const id = generator.newId();
        ids.add(id.toString());
      }

      // All IDs should be unique
      expect(ids.size).toBe(idCount);
    });

    it('generates IDs with increasing counter values', () => {
      const id1 = generator.newId();
      const id2 = generator.newId();

      // IDs generated in sequence should have sequential counter values
      // if they are in the same timestamp second
      if (id1.getTime().getTime() === id2.getTime().getTime()) {
        expect(id2.getCounter() - id1.getCounter()).toBe(1);
      }
    });

    it('uses provided timestamp when specified', () => {
      const testDate = new Date('2020-01-01T00:00:00Z');
      const id = generator.newId(testDate);

      // The ID should have the timestamp we provided
      expect(id.getTime().getTime()).toBe(testDate.getTime());
    });

    it('uses correct machine ID and process ID', () => {
      const id = generator.newId();

      // The ID should have the generator's machine ID and process ID
      expect(Array.from(id.getMachineId())).toEqual(Array.from(generator.machineId));
      expect(id.getProcessId()).toBe(generator.pid);
    });
  });

  describe('fastId method', () => {
    it('generates valid ID strings', () => {
      const idString = generator.fastId();

      // Check that the string is the correct length and format
      expect(idString.length).toBe(20);
      // Should only contain base32hex characters (0-9 and a-v)
      expect(idString).toMatch(/^[0-9a-v]{20}$/);
    });

    it('generates unique ID strings', () => {
      const idCount = 1000;
      const ids = new Set<string>();

      for (let i = 0; i < idCount; i++) {
        ids.add(generator.fastId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(idCount);
    });
  });

  describe('thread safety', () => {
    it('handles parallel ID generation safely', async () => {
      const parallelCount = 100;
      const promises: Promise<XID>[] = [];

      // Generate IDs in parallel
      for (let i = 0; i < parallelCount; i++) {
        promises.push(Promise.resolve(generator.newId()));
      }

      const ids = await Promise.all(promises);
      const uniqueIds = new Set(ids.map((id) => id.toString()));

      // All IDs should be unique even when generated in parallel
      expect(uniqueIds.size).toBe(parallelCount);
    });
  });
});
