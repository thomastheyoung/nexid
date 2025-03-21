import { afterEach, describe, expect, it, vi } from 'vitest';
import { XID } from '../../src/core/xid';
import { XIDGenerator, XIDGeneratorBuilder } from '../../src/core/xid-generator';

const MACHINE_ID_SIZE = 3;

describe('XIDGenerator', async () => {
  // Set up a default generator for tests
  const generator: XIDGenerator = await new XIDGeneratorBuilder().build();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('build method', () => {
    it('creates a default generator with valid components', async () => {
      const gen = await new XIDGeneratorBuilder().build();
      const info = gen.info();

      // Check machine ID
      expect(info.machineId).toBeInstanceOf(Uint8Array);
      expect(info.machineId.length).toBe(MACHINE_ID_SIZE);

      // Check process ID
      expect(typeof info.pid).toBe('number');
      expect(info.pid).toBeGreaterThanOrEqual(0);
      expect(info.pid).toBeLessThanOrEqual(0xffff); // 16-bit value
    });

    it('accepts custom process ID', async () => {
      const customProcessId = 0x1234;
      const gen = await new XIDGeneratorBuilder().withProcessId(customProcessId).build();

      // Check that the custom process ID was used
      expect(gen.info().pid).toBe(customProcessId);
    });

    it('accepts custom random source', async () => {
      // Mock random source that returns predictable values
      const mockRandomSource = (size: number): Uint8Array => {
        return new Uint8Array(size).fill(0x42);
      };
      const gen = await new XIDGeneratorBuilder().withRandomSource(mockRandomSource).build();

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
      const gen = await new XIDGeneratorBuilder().withMachineId('').build();
      const machineId = gen.info().machineId;

      // The machine ID should not be our invalid one
      expect(machineId.length).toBe(MACHINE_ID_SIZE);
      expect(Array.from(machineId)).not.toEqual([0xaa, 0xbb]);
    });

    it('rejects invalid process ID', async () => {
      // Process ID that's out of 16-bit range
      const invalidProcessId = 0x10000; // 17 bits set

      // We expect build to still succeed but use a default process ID instead
      const gen = await new XIDGeneratorBuilder().withProcessId(invalidProcessId).build();
      const pid = gen.info().pid;

      // The process ID should be a 16-bit value, not our invalid one
      expect(pid).toBeLessThanOrEqual(0xffff);
      expect(pid).not.toBe(invalidProcessId);
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
      if (id1.time.getTime() === id2.time.getTime()) {
        expect(id2.counter - id1.counter).toBe(1);
      }
    });

    it('uses provided timestamp when specified', () => {
      const testDate = new Date('2020-01-01T00:00:00Z');
      const id = generator.newId(testDate);

      // The ID should have the timestamp we provided
      expect(id.time.getTime()).toBe(testDate.getTime());
    });

    it('uses correct machine ID and process ID', () => {
      const id = generator.newId();

      // The ID should have the generator's machine ID and process ID
      expect(Array.from(id.machineId)).toEqual(Array.from(generator.info().machineId));
      expect(id.processId).toBe(generator.info().pid);
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
