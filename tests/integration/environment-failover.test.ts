import crypto from 'node:crypto';
import os from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NeXID, { XID } from '../../src/node';

describe('Environment Failover', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const mockError = () => {
    throw new Error();
  };

  describe('Random source failover', () => {
    it('throws by default when secure random source is unavailable', () => {
      vi.spyOn(crypto, 'randomBytes').mockImplementation(mockError);
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(mockError);

      expect(() => NeXID.init()).toThrow(/RandomBytes/);
    });

    it('initializes with fallback when allowInsecure is true', () => {
      vi.spyOn(crypto, 'randomBytes').mockImplementation(mockError);
      vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(mockError);

      const nexid = NeXID.init({ allowInsecure: true });

      expect(nexid.degraded).toBe(true);

      // Should be able to generate IDs
      const id = nexid.newId();
      expect(id.toString()).toMatch(/^[0-9a-v]{20}$/);
    });
  });

  describe('Machine ID failover', () => {
    it('initializes with random machine ID when platform methods fail', () => {
      vi.spyOn(os, 'hostname').mockImplementation(mockError);
      vi.spyOn(os, 'networkInterfaces').mockImplementation(mockError);

      // Should still initialize (MachineId is not critical)
      const nexid = NeXID.init();

      // Should be able to generate IDs
      const id = nexid.newId();
      expect(id.toString()).toMatch(/^[0-9a-v]{20}$/);
    });
  });

  describe('Process ID failover', () => {
    it('initializes with random process ID when platform methods fail', () => {
      const currentPid = process.pid;
      vi.stubGlobal('process', { pid: undefined });

      // Should still initialize (ProcessId is not critical)
      const nexid = NeXID.init();
      expect(nexid.processId === currentPid).toBeFalsy();

      // Should be able to generate IDs
      const id = nexid.newId();
      expect(id.toString()).toMatch(/^[0-9a-v]{20}$/);
    });
  });

  describe('Cross-environment compatibility', () => {
    it('generates compatible IDs between environments', () => {
      // Create a generator with fixed machine ID and process ID
      // This simulates IDs generated in different environments but with the same inputs
      const processId = 0x1234;
      const timestamp = new Date('2023-01-01T00:00:00Z');
      const machineId = 'custom-machine-id';

      const nexid = NeXID.init({ machineId, processId });

      // Generate an ID with a fixed timestamp
      const id: XID = nexid.newId(timestamp);

      // The first 9 bytes (timestamp, machine ID, process ID) should be predictable
      // Only the counter varies
      const bytes = id.bytes;

      // Check timestamp (first 4 bytes)
      const timestampBytes = bytes.slice(0, 4);
      const expectedTimestamp = Math.floor(timestamp.getTime() / 1000);
      const actualTimestamp =
        (timestampBytes[0] << 24) |
        (timestampBytes[1] << 16) |
        (timestampBytes[2] << 8) |
        timestampBytes[3];
      expect(actualTimestamp).toBe(expectedTimestamp);

      // Check machine ID (next 3 bytes) — nexid.machineId is hashed hex
      expect(nexid.machineId).toMatch(/^[0-9a-f]{6}$/);

      const actualMachineId = bytes.slice(4, 7);
      expect(actualMachineId).toEqual(id.machineId);

      // Check process ID (next 2 bytes)
      const actualProcessId = (bytes[7] << 8) | bytes[8];
      expect(actualProcessId).toBe(processId);
    });
  });
});
