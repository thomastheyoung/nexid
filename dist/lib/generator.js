"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createXidGenerator = createXidGenerator;
exports.getDefaultGenerator = getDefaultGenerator;
const encoding_1 = require("./encoding");
const environment_1 = require("./environment");
const types_1 = require("./types");
const nexid_1 = require("./nexid");
// ============================================================================
// Custom generator capability
// ============================================================================
/**
 * Create an XID generator with custom options
 */
function createXidGenerator(options = {}) {
    // Set up random source
    const randomSource = options.randomSource || (0, environment_1.createRandomSource)(options.allowInsecureRandomFallback);
    // Generate machine ID if not provided
    const machineId = options.machineId || (0, environment_1.generateMachineId)(randomSource);
    if (machineId.length !== 3) {
        throw new Error('Machine ID must be exactly 3 bytes');
    }
    // Set process ID
    const pid = options.processId !== undefined ? options.processId & 0xffff : (0, environment_1.generateProcessId)(randomSource);
    // Initialize counter with random value
    let counter = (randomSource(3)[0] << 16) | (randomSource(3)[1] << 8) | randomSource(3)[2];
    /**
     * Internal function to create a new ID
     */
    function createId(time) {
        const id = new Uint8Array(encoding_1.RAW_LEN);
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
        return new nexid_1.ID(id);
    }
    // Return the generator object
    return {
        generate() {
            return createId(new Date());
        },
        generateWithTime(time) {
            return createId(time);
        },
        fromString(idStr) {
            const bytes = (0, encoding_1.decode)(idStr);
            if (!bytes) {
                throw new types_1.InvalidIDError(`Invalid ID string: ${idStr}`);
            }
            return new nexid_1.ID(bytes);
        },
        fromBytes(bytes) {
            if (bytes.length !== encoding_1.RAW_LEN) {
                throw new types_1.InvalidIDError(`ID must be exactly ${encoding_1.RAW_LEN} bytes`);
            }
            return new nexid_1.ID(bytes);
        },
        nil() {
            return new nexid_1.ID();
        },
    };
}
// ============================================================================
// Default generator
// ============================================================================
// Create a default generator instance
let defaultGenerator = null;
/**
 * Get the default generator, creating it if needed
 */
function getDefaultGenerator() {
    if (!defaultGenerator) {
        try {
            defaultGenerator = createXidGenerator({
                allowInsecureRandomFallback: false,
            });
        }
        catch (error) {
            if (error instanceof types_1.RandomSourceUnavailableError) {
                throw new Error('No secure random source available. Use createXidGenerator with custom options.');
            }
            throw error;
        }
    }
    return defaultGenerator;
}
