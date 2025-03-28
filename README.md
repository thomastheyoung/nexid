# NeXID - Fast, Lexicographically Sortable Unique IDs

[![npm version](https://img.shields.io/npm/v/nexid.svg?style=flat&color=orange)](https://www.npmjs.com/package/nexid)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A TypeScript implementation of globally unique identifiers that are lexicographically sortable, following the [XID specification](https://github.com/rs/xid). This library provides a high-performance solution for generating and working with XIDs across JavaScript runtimes.

## Features

- **Lexicographically Sortable**: Natural sorting in databases, binary searches, and indexes
- **Time-Ordered**: Built-in chronological ordering (timestamp is the first component)
- **Compact**: 20 characters vs 36 for UUID (44% smaller)
- **URL-Safe**: Alphanumeric only (0-9 and a-v), no special characters to escape
- **Universal**: Works in Node.js, browsers, Deno, and edge runtimes
- **Fast**: Generates 10+ million IDs per second
- **Secure**: Uses platform-specific cryptographic random number generation
- **Adaptive**: Runtime environment detection with appropriate optimizations
- **Type-Safe**: Branded types for compile-time safety

## Installation

```bash
npm install nexid
```

## Quick Start

```typescript
import NeXID, { XID } from 'nexid';

// Initialize the generator (required before generating IDs)
const generator = await NeXID.init();

// Generate a new ID
const id = generator.newId();
console.log(id.toString()); // e.g. "cv37img5tppgl4002kb0"

// Generate a string ID directly (fast path in v1.0)
const idString = generator.fastId();

// Extract the timestamp
const timestamp = id.time;
console.log(timestamp.toISOString()); // e.g. "2025-03-07T12:34:56.000Z"

// Parse from an existing string
try {
  const parsedId = XID.fromString('cv37img5tppgl4002kb0');
  console.log(parsedId.time);
} catch (error) {
  console.error('Invalid ID format');
}
```

## Structure

Each NeXID consists of 12 bytes (96 bits), encoded as 20 characters:

```
  ╔═══════════════════════════════════════════════════════════════╗
  ║0             3║4             6║7             8║9            11║
  ║--- 4 bytes ---║--- 3 bytes ---║--- 2 bytes ---║--- 3 bytes ---║
  ║═══════════════════════════════════════════════════════════════║
  ║     time      ║   machine ID  ║   process ID  ║    counter    ║
  ╚═══════════════════════════════════════════════════════════════╝
```

- **Timestamp**: 4 bytes (seconds since Unix epoch)
- **Machine ID**: 3 bytes (derived from hostname or fingerprinting)
- **Process ID**: 2 bytes (process ID or tab/window unique identifier)
- **Counter**: 3 bytes (atomic counter, initialized with random seed)

This is encoded using base32-hex (characters 0-9 and a-v) for a 20-character string.

## API Reference

### Generator

```typescript
import NeXID, { XID } from 'nexid';

// Initialize with default settings
const generator = await NeXID.init();

// Generate a new ID
const id = generator.newId();

// Generate with a specific timestamp
const pastId = generator.newId(new Date('2025-01-01'));

// Generate a string ID directly
const idString = generator.fastId();

// Access generator properties
console.log(generator.machineId); // The machine ID used by this generator
console.log(generator.processId); // The process ID used by this generator
```

### Custom Generator

```typescript
import { init } from 'nexid';

// Create a custom generator with options
const generator = await init({
  // Optional: Custom machine ID (string)
  machineId: 'custom-machine-id',

  // Optional: Specific process ID (number)
  processId: 12345,

  // Optional: Custom random source function
  randomBytes: (size) => {
    // Your custom secure random implementation
    const bytes = new Uint8Array(size);
    // Fill with random values...
    return bytes;
  },
});
```

### XID Class

```typescript
import { XID } from 'nexid';

// Create from string (throws on invalid input)
const id = XID.fromString('cv37img5tppgl4002kb0');

// Create from byte array (throws on invalid input)
const bytes = new Uint8Array(12); // Must be exactly 12 bytes
const idFromBytes = XID.fromBytes(bytes);

// Create a nil (zero) ID
const nilID = XID.nilID();

// Get string representation
const str = id.toString();

// Get Date object from the timestamp portion
const date = id.time;

// Get the machine ID component (3 bytes)
const machineId = id.machineId;

// Get the process ID number
const pid = id.processId;

// Get the counter value
const counter = id.counter;

// Compare two IDs
if (id1.equals(id2)) {
  console.log('IDs are identical');
}

// Check if this is a nil (zero) ID
if (id.isNil()) {
  console.log('This is a nil ID');
}

// JSON serialization (automatically converts to string)
const json = JSON.stringify({ id });
```

### Helper Functions

The package includes several helper functions for working with XIDs:

```typescript
import { helpers } from 'nexid/core/helpers';

// Sort an array of XIDs chronologically
const sorted = helpers.sortIds([id3, id1, id2]);

// Compare two XIDs
const comparison = helpers.compare(id1, id2);
// Returns: -1 if id1 < id2, 0 if equal, 1 if id1 > id2

// Check if two XIDs are equal
const areEqual = helpers.equals(id1, id2);
```

## Runtime Environment Adaptation

NeXID 1.0 includes an environment detection system that selects the optimal implementation for different runtimes:

- **Server Environments (Node.js)**

  - Hardware machine ID detection
  - Process ID integration
  - Native crypto for secure randomness

- **Browser Environment**

  - Privacy-preserving device fingerprinting
  - Tab/window context isolation
  - Web Crypto API for random generation

- **Deno Runtime**

  - Deno-specific API support
  - Process ID integration

- **Edge/Serverless**
  - Container detection in serverless environments
  - Minimal fingerprinting for edge functions
  - Graceful fallbacks for restricted environments

## Performance

NeXID 1.0 delivers performance on par with or exceeding Node's native `randomUUID`:

| Library            | Speed (IDs/sec) | Time-based | URL-safe | Fixed length | Size (chars) |
| ------------------ | --------------: | :--------: | :------: | :----------: | :----------: |
| hyperid            |      55,692,941 |     ❌     |    ❌    |      ❌      |      24      |
| **NeXID.fastId()** |  **10,702,629** |   **✅**   |  **✅**  |    **✅**    |    **20**    |
| **NeXID.newId()**  |  **10,495,276** |   **✅**   |  **✅**  |    **✅**    |    **20**    |
| node randomUUID    |       9,652,435 |     ❌     |    ❌    |      ✅      |      36      |
| uuid v4            |       9,266,366 |     ❌     |    ❌    |      ✅      |      36      |
| nanoid             |       7,019,649 |     ❌     |    ✅    |      ✅      |      21      |
| uuid v1            |       3,326,415 |     ✅     |    ❌    |      ✅      |      36      |
| shortid            |         719,862 |     ❌     |    ✅    |      ❌      |   variable   |
| ksuid              |          80,120 |     ✅     |    ✅    |      ✅      |      27      |
| ulid               |          57,568 |     ✅     |    ✅    |      ✅      |      26      |

_Note: Benchmarks on Node.js v22 on Apple Silicon. Results may vary by environment._

## What's New in 1.0

- **Architecture**: Clear separation between core logic and platform-specific code
- **Environment Feature Registry**: Automatic detection of optimal implementations
- **Performance**: Improved algorithms and encoding
- **Type Safety**: Branded TypeScript types for compile-time checking
- **Container Support**: Special handling for containerized environments
- **Security**: Platform-specific optimizations for random generation

## Browser Support

NeXID works in all modern browsers with environment-specific optimizations:

- Uses Web Crypto API for secure random generation
- Privacy-respecting browser fingerprinting for consistent machine IDs
- Tab/window-specific process IDs
- Fallbacks for constrained environments

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Bundle the library
npm run bundle

# Run tests
npm test

# Run benchmarks
npm run benchmark
```

## Credits

- Original [XID specification](https://github.com/rs/xid) by Olivier Poitrey
- Inspired by MongoDB's ObjectID and Twitter's Snowflake

## License

[MIT License](LICENSE)
