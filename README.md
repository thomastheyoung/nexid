# NeXID - Fast, Lexicographically Sortable Unique IDs

[![npm version](https://img.shields.io/npm/v/nexid-ts.svg?style=flat&color=orange)](https://www.npmjs.com/package/nexid)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A fast, efficient TypeScript implementation of the [XID specification](https://github.com/rs/xid) - globally unique identifiers that are lexicographically sortable. This library provides a complete solution for generating and working with NeXIDs in both Node.js and browser environments.

## Features

- **🔤 Lexicographically Sortable**: IDs sort naturally in databases and binary searches
- **🕒 Time-Ordered**: First component is timestamp, so IDs sort chronologically
- **📦 Compact**: 20 characters vs 36 for UUID
- **🔗 URL-Safe**: Uses only alphanumeric characters (0-9 and a-v)
- **🌐 Universal**: Works in any JavaScript environment (Node.js, browsers, Deno)
- **⚡️ Fast**: Generates ~3 million IDs per second
- **🔒 Secure**: Uses cryptographically strong random values
- **🧩 TypeScript**: Full type definitions and type safety

## Installation

```bash
npm install nexid
```

## Quick Start

```typescript
import NeXID from 'nexid';

// Generate a new ID
const id = NeXID.newId();
console.log(id.toString()); // e.g. "cv37img5tppgl4002kb0"

// Extract the timestamp
const timestamp = id.getTime();
console.log(timestamp.toISOString()); // e.g. "2025-03-04T03:54:00.000Z"

// Parse from an existing string
const parsedId = NeXID.fromString('cv37img5tppgl4002kb0');

// Sort IDs chronologically (oldest to newest)
const sortedIds = NeXID.sortIds([id3, id1, id2]);
```

## Why NeXID?

XIDs provide a perfect balance of features that make them ideal for many applications:

1. **vs. UUID** - Significantly more compact (20 chars vs 36), with lexicographical and chronological sorting
2. **vs. auto-increment** - Distributed generation without central coordination
3. **vs. timestamp+random** - Structured format with guaranteed uniqueness
4. **vs. snowflake** - No configuration or central server required

## Structure

Each NeXID consists of 12 bytes (96 bits), encoded as 20 characters:

```
|--- 4 bytes ---||--- 3 bytes ---||--- 2 bytes ---||--- 3 bytes ---|
      time          machine ID        process ID        counter
```

- **Timestamp**: 4 bytes (seconds since Unix epoch)
- **Machine ID**: 3 bytes (derived from hostname or random)
- **Process ID**: 2 bytes (process ID or random value)
- **Counter**: 3 bytes (incremented for each ID, starts with random value)

This is then encoded using base32-hex (characters 0-9 and a-v), resulting in a 20-character string.

## API Reference

### Basic Functions

```typescript
// Generate a new ID with the current timestamp
const id = NeXID.newId();

// Generate an ID with a specific timestamp
const pastId = NeXID.newId(new Date('2020-01-01'));

// Parse an ID from a string
const parsed = NeXID.fromString('cv37img5tppgl4002kb0');

// Create an ID from raw bytes
const bytes = new Uint8Array(12); // Must be exactly 12 bytes
const idFromBytes = NeXID.fromBytes(bytes);

// Get a nil (zero) ID
const nilID = NeXID.nilId;

// Sort an array of IDs lexicographically (which also sorts them chronologically)
const sorted = NeXID.sortIds(myIds);
```

### Advanced Usage: Custom Generator

```typescript
import { createXidGenerator } from 'xid';

// Create a custom generator with options
const generator = createXidGenerator({
  // Optional: Custom machine ID (3 bytes)
  machineId: new Uint8Array([1, 2, 3]),

  // Optional: Set a specific process ID
  processId: 12345,

  // Optional: Custom random source (for controlled environments)
  randomSource: (size) => {
    // Your custom secure random implementation
    const bytes = new Uint8Array(size);
    // Fill with random values...
    return bytes;
  },

  // Optional: Allow fallback to non-cryptographic random
  // NOT recommended for production!
  allowInsecureRandomFallback: false,
});

// Generate IDs with the custom generator
const id1 = generator.generate();
const id2 = generator.generateWithTime(new Date());
```

### ID Object API

Each ID instance provides these methods:

```typescript
// Get string representation
const str = id.toString();

// Get Date object from the timestamp portion
const date = id.getTime();

// Get the machine ID portion (3 bytes)
const machineId = id.getMachineId();

// Get the process ID number
const pid = id.getProcessId();

// Get the counter value
const counter = id.getCounter();

// Get a copy of the raw bytes
const bytes = id.toBytes();

// Compare two IDs lexicographically (which also compares them chronologically)
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
```

## Performance

XID achieves excellent performance while maintaining its feature set:

| Library         | Speed (IDs/sec) | Time-based | URL-safe | Fixed length | Size (chars) |
| --------------- | --------------: | :--------: | :------: | :----------: | :----------: |
| hyperid         |      55,436,375 |     ❌     |    ❌    |      ❌      |      24      |
| node randomUUID |       9,397,714 |     ❌     |    ❌    |      ✅      |      36      |
| uuid v4         |       9,317,440 |     ❌     |    ❌    |      ✅      |      36      |
| nanoid          |       7,012,800 |     ❌     |    ✅    |      ✅      |      21      |
| uuid v1         |       3,326,121 |     ✅     |    ❌    |      ✅      |      36      |
| **xid**         |   **3,110,861** |     ✅     |    ✅    |      ✅      |      20      |
| shortid         |         714,054 |     ❌     |    ✅    |      ❌      |   variable   |
| ksuid           |          85,597 |     ✅     |    ✅    |      ✅      |      27      |
| ulid            |          50,167 |     ✅     |    ✅    |      ✅      |      26      |

Note: Benchmarks run on Node.js v22 on a modern machine. Results may vary.

## Browser Support

XID works in all modern browsers and uses the native `crypto.getRandomValues()` API for secure random generation.

## Error Handling

The library throws typed errors to help handle edge cases:

```typescript
import { InvalidIDError, RandomSourceUnavailableError } from 'xid';

try {
  const id = fromString('invalid-id-string');
} catch (err) {
  if (err instanceof InvalidIDError) {
    console.error('Invalid ID format:', err.message);
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run benchmarks
npm run benchmark
```

## Documentation

More extensive documentation is available in the docs directory:

- [Benchmark Results](docs/benchmark-results.md) - Detailed performance comparison
- [Library Comparison](docs/comparison.md) - Feature comparison between ID libraries
- [Migration Guide](docs/migration-guide.md) - How to migrate from other ID libraries

## Credits

Based on the [XID specification](https://github.com/rs/xid) by Olivier Poitrey.

## License

[MIT License](LICENSE)
