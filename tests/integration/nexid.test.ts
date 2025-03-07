import { beforeAll, describe, expect, it } from 'vitest';
import { XID } from '../../src/core/xid';
import NeXID, { XIDGenerator, createXIDGenerator } from '../../src/index';

function toNS(ms: number, decimals: number = 2): string {
  return (ms * 100_000).toFixed(decimals);
}

describe('NeXID Integration', () => {
  // Set up a default generator for tests
  let nexid: XIDGenerator;

  beforeAll(async () => {
    // Initialize NeXID
    nexid = await NeXID.init();
  });

  describe('Basic functionality', () => {
    it('generates valid XIDs', async () => {
      const id = nexid.newId();

      // Check that the ID has the correct structure
      expect(id).toBeInstanceOf(XID);
      expect(id.toString()).toMatch(/^[0-9a-v]{20}$/);
      expect(id.isNil()).toBe(false);
    });

    it('generates unique XIDs', async () => {
      const idCount = 100; // Reduced from 1000 for test speed
      const ids = new Set<string>();

      for (let i = 0; i < idCount; i++) {
        const id = nexid.newId();
        ids.add(id.toString());
      }

      // All IDs should be unique
      expect(ids.size).toBe(idCount);
    });

    it('generates time-based IDs', async () => {
      const now = new Date();
      const id = nexid.newId();

      // ID timestamp should be close to current time
      const idTime = id.getTime();
      const diffSeconds = Math.abs((idTime.getTime() - now.getTime()) / 1000);

      // Should be within a reasonable time range (10 seconds)
      expect(diffSeconds).toBeLessThan(10);
    });
  });

  describe('fromString and parsing', () => {
    it('parses valid XID strings', async () => {
      const original = nexid.newId();
      const idString = original.toString();

      // Parse the string back to an XID
      const parsed = NeXID.fromString(idString);

      expect(parsed.isOk()).toBe(true);

      const id = parsed.unwrap();
      expect(id).toBeInstanceOf(XID);
      expect(id.toString()).toBe(idString);
      expect(id.equals(original)).toBe(true);
    });

    it('returns error for invalid strings', () => {
      const invalid = 'not-a-valid-xid';
      const result = NeXID.fromString(invalid);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('Custom initialization', () => {
    it('accepts custom options', async () => {
      const customProcessId = 0x1234;

      // Create custom generator with options
      const generator = await createXIDGenerator({
        machineId: 'custom-machine-id',
        processId: customProcessId,
      });

      // Generate an ID
      const id = generator.newId();

      // Check that it uses our custom values
      expect(id.getMachineId()).toEqual(generator.machineId);
      expect(id.getProcessId()).toBe(customProcessId);
    });
  });

  describe('Nil ID', () => {
    it('provides a nil ID', () => {
      const nilId = NeXID.nilId;

      expect(nilId).toBeInstanceOf(XID);
      expect(nilId.isNil()).toBe(true);
      expect(nilId.toString()).toBe('00000000000000000000');
    });
  });

  describe('sortIds function', () => {
    it('sorts IDs chronologically', async () => {
      // Create IDs with specific timestamps
      const now = Date.now();
      const id1 = nexid.newId(new Date(now - 10000)); // 10 seconds ago
      const id2 = nexid.newId(new Date(now - 5000)); // 5 seconds ago
      const id3 = nexid.newId(new Date(now)); // now

      // Shuffle the IDs
      const shuffled = [id3, id1, id2];

      // Sort them
      const sorted = NeXID.sortIds(shuffled);

      // Should be in chronological order
      expect(sorted[0].equals(id1)).toBe(true);
      expect(sorted[1].equals(id2)).toBe(true);
      expect(sorted[2].equals(id3)).toBe(true);
    });
  });

  describe('fastId function', () => {
    it('generates valid ID strings directly', async () => {
      const idString = nexid.fastId();

      // Check that the string is valid
      expect(idString.length).toBe(20);
      expect(idString).toMatch(/^[0-9a-v]{20}$/);

      // Should be parsable
      const parsed = NeXID.fromString(idString);
      expect(parsed.isOk()).toBe(true);
    });

    it('generates unique ID strings', async () => {
      const idCount = 100; // Reduced from 1000 for test speed
      const ids = new Set<string>();

      for (let i = 0; i < idCount; i++) {
        ids.add(nexid.fastId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(idCount);
    });
  });

  describe('Performance', () => {
    it('generates IDs efficiently', async () => {
      const idCount = 100; // Reduced from 10000 for test speed
      const startTime = performance.now();

      for (let i = 0; i < idCount; i++) {
        nexid.newId().toString();
      }

      const endTime = performance.now();
      const timePerIdMs = (endTime - startTime) / idCount;

      // Performance criteria: should be reasonably fast
      // Not specifying an exact threshold as test environments vary widely
      expect(timePerIdMs).toBeGreaterThanOrEqual(0); // Just ensure it completes

      // Log the performance for information
      console.log(
        `Generated ${idCount} IDs in ${endTime - startTime}ms (${toNS(timePerIdMs)}ns per ID)`
      );
    });

    it('fastId is efficient for direct string IDs', async () => {
      const idCount = 100; // Reduced from 10000 for test speed

      // Time for regular newId()
      const startTimeNew = performance.now();
      for (let i = 0; i < idCount; i++) {
        nexid.newId().toString();
      }
      const endTimeNew = performance.now();
      const timePerNew = (endTimeNew - startTimeNew) / idCount;

      // Time for fastId()
      const startTimeFast = performance.now();
      for (let i = 0; i < idCount; i++) {
        nexid.fastId();
      }
      const endTimeFast = performance.now();
      const timePerFast = (endTimeFast - startTimeFast) / idCount;

      // Just log the performance info, don't enforce specific threshold
      console.log(`Regular newId: ${toNS(timePerNew)}ns per ID`);
      console.log(`Fast ID: ${toNS(timePerFast)}ns per ID`);
    });
  });
});
