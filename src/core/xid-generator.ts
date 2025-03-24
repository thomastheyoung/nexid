/**
 * @module nexid/core/xid-generator
 */

import { BYTE_MASK, RAW_LEN } from 'nexid/common/constants';
import { Environment } from 'nexid/env/registry';
import { XIDBytes } from 'nexid/types/xid';
import { Generator } from 'nexid/types/xid-generator';
import { createAtomicCounter } from './counter';
import { encode } from './encoding';
import { XID } from './xid';

export async function XIDGenerator(
  env: Environment,
  options: Generator.Options = {}
): Promise<Generator.API> {
  // ==========================================================================
  // Setup components
  // ==========================================================================
  // Resolve capabilities
  const randomBytes = await env.get('RandomBytes', options.randomBytes || null);
  const hashFunction = await env.get('HashFunction');
  const getMachineId = await env.get(
    'MachineId',
    options.machineId ? async () => options.machineId as string : null
  );

  // Use first 3 bytes of machineId hash
  const machineId = await getMachineId();
  const machineIdBytes = (await hashFunction(machineId)).subarray(0, 3);

  // Process ID
  let getProcessId = await env.get(
    'ProcessId',
    options.processId ? async () => options.processId as number : null
  );
  const processId = (await getProcessId()) & 0xffff;

  // ==========================================================================
  // Constructor
  // ==========================================================================
  // ~~~~~~~~~~~~~~~~~~ Counter ~~~~~~~~~~~~~~~~~~
  const b1 = randomBytes(3);
  const b2 = randomBytes(3);
  const b3 = randomBytes(3);
  const randomSeed = (b1[0] << 16) | (b2[1] << 8) | b3[2];

  const counter = createAtomicCounter(randomSeed);

  // ~~~~~~~~~~~~~~~~~~ Base Buffer ~~~~~~~~~~~~~~~~~~
  const buffer = new Uint8Array(RAW_LEN);

  // Machine ID (3 bytes)
  buffer[4] = machineIdBytes[0] & BYTE_MASK;
  buffer[5] = machineIdBytes[1] & BYTE_MASK;
  buffer[6] = machineIdBytes[2] & BYTE_MASK;

  // Process ID (2 bytes, big endian)
  buffer[7] = (processId >> 8) & BYTE_MASK;
  buffer[8] = processId & BYTE_MASK;

  const baseBuffer = buffer;

  // ==========================================================================
  // ID generation
  // ==========================================================================
  function buildXIDBytes(timestamp: number): Readonly<XIDBytes> {
    const buffer = new Uint8Array(baseBuffer);

    // Convert to seconds for the ID (XID spec uses seconds, not milliseconds)
    timestamp = Math.floor(timestamp / 1000);

    // Timestamp (4 bytes, big endian)
    buffer[0] = (timestamp >> 24) & BYTE_MASK;
    buffer[1] = (timestamp >> 16) & BYTE_MASK;
    buffer[2] = (timestamp >> 8) & BYTE_MASK;
    buffer[3] = timestamp & BYTE_MASK;

    // Counter (3 bytes, big endian)
    const currentCounter = counter.getNext();
    buffer[9] = (currentCounter >> 16) & BYTE_MASK;
    buffer[10] = (currentCounter >> 8) & BYTE_MASK;
    buffer[11] = currentCounter & BYTE_MASK;

    return buffer as XIDBytes;
  }

  // ==========================================================================
  // Export API
  // ==========================================================================
  return {
    machineId,
    processId,
    newId(datetime?: Date) {
      const timestamp = datetime instanceof Date ? +datetime : Date.now();
      return XID.fromBytes(buildXIDBytes(timestamp));
    },

    fastId() {
      return encode(buildXIDBytes(Date.now()));
    },
  };
}
