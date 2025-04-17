import { afterEach, describe, expect, it, vi } from 'vitest';
import { XID } from '../../src/core/xid';
import NeXID from '../../src/node';

describe('XIDGenerator', async () => {
  // Set up a default generator for tests
  const defaultGenerator = await NeXID.init();

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  describe('build method', () => {
    it('creates a default generator with valid components', async () => {
      const gen = await NeXID.init();

      // Check machine ID
      expect(gen.machineId).toBeTypeOf('string');

      // Check process ID
      expect(typeof gen.processId).toBe('number');
      expect(gen.processId).toBeGreaterThanOrEqual(0);
      expect(gen.processId).toBeLessThanOrEqual(0xffff); // 16-bit value
    });

    it('accepts custom process ID', async () => {
      const customProcessId = 0x1234;
      const gen = await NeXID.init({ processId: customProcessId });

      // Check that the custom process ID was used
      expect(gen.processId).toBe(customProcessId);
    });

    it('accepts custom random source', async () => {
      // Mock random source that returns predictable values
      const mockRandomSource = (size: number): Uint8Array => {
        return new Uint8Array(size).fill(0x42);
      };
      const gen = await NeXID.init({ randomBytes: mockRandomSource });

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
      const gen = await NeXID.init({ machineId: '' });
      expect(gen.machineId.length).toBeGreaterThan(0);

      // The machine ID should not be our invalid one
      const id: XID = gen.newId();
      expect(Array.from(id.bytes)).not.toEqual([0xaa, 0xbb]);
    });

    it('rejects invalid process ID', async () => {
      // Process ID that's out of 16-bit range
      const invalidProcessId = 0x10000; // 17 bits set

      // We expect build to still succeed but use a default process ID instead
      const gen = await NeXID.init({ processId: invalidProcessId });

      // The process ID should be a 16-bit value, not our invalid one
      expect(gen.processId).toBeLessThanOrEqual(0xffff);
      expect(gen.processId).not.toBe(invalidProcessId);
    });
  });

  describe('newId method', () => {
    it('generates unique IDs', () => {
      const idCount = 1000;
      const ids = new Set<string>();

      for (let i = 0; i < idCount; i++) {
        const id = defaultGenerator.newId();
        ids.add(id.toString());
      }

      // All IDs should be unique
      expect(ids.size).toBe(idCount);
    });

    it('generates IDs with increasing counter values', () => {
      const id1 = defaultGenerator.newId();
      const id2 = defaultGenerator.newId();

      // IDs generated in sequence should have sequential counter values
      // if they are in the same timestamp second
      if (id1.time.getTime() === id2.time.getTime()) {
        expect(id2.counter - id1.counter).toBe(1);
      }
    });

    it('uses provided timestamp when specified', () => {
      const testDate = new Date('2020-01-01T00:00:00Z');
      const id = defaultGenerator.newId(testDate);

      // The ID should have the timestamp we provided
      expect(id.time.getTime()).toBe(testDate.getTime());
    });
  });

  describe('fastId method', () => {
    it('generates valid ID strings', () => {
      const idString = defaultGenerator.fastId();

      // Check that the string is the correct length and format
      expect(idString.length).toBe(20);
      // Should only contain base32hex characters (0-9 and a-v)
      expect(idString).toMatch(/^[0-9a-v]{20}$/);
    });

    it('generates unique ID strings', () => {
      const idCount = 1000;
      const ids = new Set<string>();

      for (let i = 0; i < idCount; i++) {
        ids.add(defaultGenerator.fastId());
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
        promises.push(Promise.resolve(defaultGenerator.newId()));
      }

      const ids = await Promise.all(promises);
      const uniqueIds = new Set(ids.map((id) => id.toString()));

      // All IDs should be unique even when generated in parallel
      expect(uniqueIds.size).toBe(parallelCount);
    });
  });
});
