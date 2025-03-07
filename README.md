# NeXID - Fast, Lexicographically Sortable Unique IDs

[![npm version](https://img.shields.io/npm/v/nexid.svg?style=flat&color=orange)](https://www.npmjs.com/package/nexid)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A TypeScript implementation of globally unique identifiers that are lexicographically sortable, following the [XID specification](https://github.com/rs/xid). This library provides a high-performance, secure solution for generating and working with XIDs in both Node.js and browser environments.

## Features

- **🔤 Lexicographically Sortable**: Natural sorting in databases, binary searches, and indexes
- **🕒 Time-Ordered**: Built-in chronological ordering (timestamp is the first component)
- **📦 Compact**: 20 characters vs 36 for UUID (44% smaller)
- **🔗 URL-Safe**: Alphanumeric only (0-9 and a-v), no special characters to escape
- **🌐 Universal**: Works in any JavaScript runtime (Node.js, browsers, Deno)
- **⚡️ Fast**: Generates ~9 million IDs per second
- **🔒 Secure**: Cryptographically strong random values with environment-specific optimizations

## Installation

```bash
npm install nexid
```

## Quick Start

```typescript
import NeXID from 'nexid';

// First, initialize the global generator
// This is an async operation that sets up environment-specific components
const nexid = await NeXID.init();

// Generate a new ID
const id = nexid.newId();
console.log(id.toString()); // e.g. "cv37img5tppgl4002kb0"

// For maximum performance, use fastId(). This only outputs a string,
// instead of a complete XID object.
const fastId = nexid.fastId(); // ~30% faster than newId()

// Extract the timestamp
const timestamp = id.getTime();
console.log(timestamp.toISOString()); // e.g. "2025-03-07T12:34:56.000Z"

// Parse from an existing string
const parsedIdResult = nexid.fromString('cv37img5tppgl4002kb0');
if (parsedIdResult.isOk()) {
  const parsedId = parsedIdResult.unwrap();
  console.log(parsedId.getTime());
}

// Sort IDs chronologically (oldest to newest)
const sortedIds = nexid.sortIds([id3, id1, id2]);
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

## Comprehensive API

### Basic Usage

```typescript
import NeXID from 'nexid';

// Initialize (must be called before using newId)
const nexid = await NeXID.init();

// Generate a new ID
const id = nexid.newId();

// Generate with a specific timestamp
const pastId = nexid.newId(new Date('2025-01-01'));

// Parse a string ID (returns a Result)
const parsedResult = nexid.fromString('cv37img5tppgl4002kb0');
const parsedId = parsedResult.unwrap(); // or use .isOk() to check first

// Create from raw bytes (returns a Result)
const bytes = new Uint8Array(12); // Must be exactly 12 bytes
const fromBytesResult = nexid.fromBytes(bytes);

// Get a nil (zero) ID
const nilID = nexid.nilId;

// Sort an array of IDs chronologically
const sorted = nexid.sortIds([id3, id1, id2]);
```

### Result Pattern for Error Handling

```typescript
import NeXID from 'nexid';

// Parse an ID from string using Result pattern
const result = NeXID.fromString('cv37img5tppgl4002kb0');

// Check if parsing succeeded
if (result.isOk()) {
  // Get the successfully parsed ID
  const id = result.unwrap();
  console.log('Timestamp:', id.getTime());
} else {
  // Handle the error
  console.error('Failed to parse ID:', result.unwrapErr());
}

// Alternative pattern with unwrapOr() for defaults
const id = NeXID.fromString('potentially-invalid-id').unwrapOr(NeXID.nilId);
```

### Custom Generator

```typescript
import { createXIDGenerator } from 'nexid';

// Create a custom generator with options
const generator = await createXIDGenerator({
  // Optional: Custom machine ID (string)
  machineId: 'custom-machine-id',

  // Optional: Specific process ID (number)
  processId: 12345,

  // Optional: Custom random source function
  randomSource: (size) => {
    // Your custom secure random implementation
    const bytes = new Uint8Array(size);
    // Fill with random values...
    return bytes;
  },

  // Optional: Security policy for environments without secure random
  allowInsecureRandomFallback: false,
});

// Generate IDs with the custom generator
const id = generator.newId();
const idWithTime = generator.newId(new Date());

// Fast, string-only generation (no XID object created)
const fastIdString = generator.fastId();
```

### XID Instance Methods

```typescript
// Get string representation
const str = id.toString();

// Get Date object from the timestamp portion
const date = id.getTime();

// Get the machine ID component (3 bytes)
const machineId = id.getMachineId();

// Get the process ID number
const pid = id.getProcessId();

// Get the counter value
const counter = id.getCounter();

// Get a copy of the raw bytes
const bytes = id.toBytes();

// Compare two IDs lexicographically
if (id1.compare(id2) > 0) {
  console.log('id1 is newer than id2');
}

// Check if two IDs are equal
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

## Performance

NeXID delivers a performance on-par with Node's native `randomUUID`, while maintaining its robust feature set:

| Library            | Speed (IDs/sec) | Time-based | URL-safe | Fixed length | Size (chars) |
| ------------------ | --------------: | :--------: | :------: | :----------: | :----------: |
| hyperid            |      55,773,818 |     ❌     |    ❌    |      ❌      |      24      |
| **NeXID.fastId()** |  **10,058,602** |   **✅**   |  **✅**  |    **✅**    |    **20**    |
| node randomUUID    |       9,695,432 |     ❌     |    ❌    |      ✅      |      36      |
| uuid v4            |       9,346,232 |     ❌     |    ❌    |      ✅      |      36      |
| **NeXID.newId()**  |   **8,358,104** |   **✅**   |  **✅**  |    **✅**    |    **20**    |
| nanoid             |       7,045,816 |     ❌     |    ✅    |      ✅      |      21      |
| uuid v1            |       3,251,316 |     ✅     |    ❌    |      ✅      |      36      |
| shortid            |         720,500 |     ❌     |    ✅    |      ❌      |   variable   |
| ksuid              |          81,854 |     ✅     |    ✅    |      ✅      |      27      |
| ulid               |          56,139 |     ✅     |    ✅    |      ✅      |      26      |

_Note: Benchmarks on Node.js v22 on Apple Silicon. Results may vary by environment._

## Browser Support

NeXID works in all modern browsers with enhanced environment-specific optimizations:

- Uses Web Crypto API (`crypto.getRandomValues()`) for secure random generation
- Privacy-respecting browser fingerprinting for consistent machine IDs
- Tab/window-specific process IDs
- Persistent storage when available
- Fallbacks for constrained environments

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Bundle the library (used by the benchmark test)
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
