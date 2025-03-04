import { decode, RAW_LEN } from './encoding';
import { createRandomSource, generateMachineId, generateProcessId } from './environment';
import { InvalidIDError, RandomSourceUnavailableError, XidGenerator, XidOptions } from './types';
import { ID } from './nexid';

// ============================================================================
// Custom generator capability
// ============================================================================

/**
 * Create an XID generator with custom options
 */
export function createXidGenerator(options: XidOptions = {}): XidGenerator {
  // Set up random source
  const randomSource =
    options.randomSource || createRandomSource(options.allowInsecureRandomFallback);

  // Generate machine ID if not provided
  const machineId = options.machineId || generateMachineId(randomSource);
  if (machineId.length !== 3) {
    throw new Error('Machine ID must be exactly 3 bytes');
  }

  // Set process ID
  const pid =
    options.processId !== undefined ? options.processId & 0xffff : generateProcessId(randomSource);

  // Initialize counter with random value
  let counter = (randomSource(3)[0] << 16) | (randomSource(3)[1] << 8) | randomSource(3)[2];

  /**
   * Internal function to create a new ID
   */
  function createId(time: Date): ID {
    const id = new Uint8Array(RAW_LEN);

    // Timestamp (4 bytes)
    const timestamp = Math.floor(time.getTime() / 1000);
    id[0] = (timestamp >> 24) & 0xff;
    id[1] = (timestamp >> 16) & 0xff;
    id[2] = (timestamp >> 8) & 0xff;
    id[3] = timestamp & 0xff;

    // Machine ID (3 bytes)
    id[4] = machineId[0];
    id[5] = machineId[1];
    id[6] = machineId[2];

    // Process ID (2 bytes)
    id[7] = (pid >> 8) & 0xff;
    id[8] = pid & 0xff;

    // Get next counter value with overflow handling
    const currentCounter = counter;
    counter = (counter + 1) & 0xffffff; // Wrap at 24 bits

    // Counter (3 bytes)
    id[9] = (currentCounter >> 16) & 0xff;
    id[10] = (currentCounter >> 8) & 0xff;
    id[11] = currentCounter & 0xff;

    return new ID(id);
  }

  // Return the generator object
  return {
    generate(): ID {
      return createId(new Date());
    },

    generateWithTime(time: Date): ID {
      return createId(time);
    },

    fromString(idStr: string): ID {
      const bytes = decode(idStr);
      if (!bytes) {
        throw new InvalidIDError(`Invalid ID string: ${idStr}`);
      }
      return new ID(bytes);
    },

    fromBytes(bytes: Uint8Array): ID {
      if (bytes.length !== RAW_LEN) {
        throw new InvalidIDError(`ID must be exactly ${RAW_LEN} bytes`);
      }
      return new ID(bytes);
    },

    nil(): ID {
      return new ID();
    },
  };
}

// ============================================================================
// Default generator
// ============================================================================

// Create a default generator instance
let defaultGenerator: XidGenerator | null = null;

/**
 * Get the default generator, creating it if needed
 */
export function getDefaultGenerator(): XidGenerator {
  if (!defaultGenerator) {
    try {
      defaultGenerator = createXidGenerator({
        allowInsecureRandomFallback: false,
      });
    } catch (error) {
      if (error instanceof RandomSourceUnavailableError) {
        throw new Error(
          'No secure random source available. Use createXidGenerator with custom options.'
        );
      }
      throw error;
    }
  }
  return defaultGenerator;
}
