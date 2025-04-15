# NeXID - Fast, lexicographically sortable unique IDs

[![npm version](https://img.shields.io/npm/v/nexid.svg?style=flat&color=orange)](https://www.npmjs.com/package/nexid)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A TypeScript implementation of globally unique identifiers that are lexicographically sortable, following the [XID specification](https://github.com/rs/xid), originally inspired by Mongo Object ID algorithm. NeXID provides a high-performance solution for generating and working with XIDs across JavaScript runtimes.

## Features

- **Lexicographically sortable**: natural sorting in databases, binary searches, and indexes
- **Time-ordered**: built-in chronological ordering (timestamp is the first component)
- **Compact**: 20 characters vs 36 for UUIDs (44% smaller)
- **URL-safe**: alphanumeric only (0-9 and a-v), no special characters to escape
- **Universal**: works in Node.js, browsers, Deno, and edge runtimes
- **Fast**: generates 10+ million IDs per second
- **Secure**: uses platform-specific cryptographic random number generation
- **Adaptive**: runtime environment detection with appropriate optimizations
- **Type-safe**: branded types for compile-time safety

## Installation

```bash
npm install nexid
yarn add nexid
pnpm add nexid
```

## Quick start

```typescript
import NeXID from 'nexid';

// Single initialization per application lifecycle
const nexid = await NeXID.init();

// Standard ID generation with object representation
const id = nexid.newId();
const idString = id.toString(); // "cv37img5tppgl4002kb0"

// High-throughput string-only generation
const fastIdString = nexid.fastId();
```

## Architecture

### Entry points

Multiple entry points for optimized tree-shaking and bundle size:

- **Universal**: `import NeXID from 'nexid'` - Auto-detects environment
- **Node.js**: `import NeXID from 'nexid/node'` - Node.js optimized bundle
- **Deno**: `import NeXID from 'nexid/deno'` - Deno optimized bundle
- **Web**: `import NeXID from 'nexid/web'` - Browser optimized bundle

### XID structure

Each XID consists of 12 bytes (96 bits), encoded as 20 characters:

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                         Binary Structure (12 bytes)                       |
  ├────────────────────────┬──────────────────┬────────────┬──────────────────┤
  │        Timestamp       │    Machine ID    │ Process ID │      Counter     │
  │        (4 bytes)       │     (3 bytes)    │  (2 bytes) │     (3 bytes)    │
  └────────────────────────┴──────────────────┴────────────┴──────────────────┘
```

- **Timestamp**: 4 bytes (seconds since Unix epoch)
- **Machine ID**: 3 bytes (derived from hostname, os registries or fingerprinting)
- **Process ID**: 2 bytes (process ID or tab/window unique identifier)
- **Counter**: 3 bytes (atomic counter, initialized with random seed)

The timestamp's position ensures lexicographical comparison naturally sorts IDs by creation time.

### Runtime adaptability

The implementation detects its environment and applies appropriate strategies:

- **Server**: uses hardware identifiers, process IDs, and native cryptography
- **Browser**: implements fingerprinting, context isolation, and Web Crypto API
- **Edge/Serverless**: adapts to constrained environments with fallback mechanisms

## System impact

### Database operations

Lexicographical sortability enables database optimizations:

- **Index efficiency**: B-tree indices perform optimally with ordered keys
- **Range queries**: time-based queries function as simple index scans
- **Storage**: 44% size reduction translates to storage savings at scale

Example range query:

```sql
-- Retrieving time-ordered data without timestamp columns
SELECT * FROM events
WHERE id >= 'cv37ijlxxxxxxxxxxxxxxx' -- Start timestamp
AND id <= 'cv37mogxxxxxxxxxxxxxxx'   -- End timestamp
```

### Distributed systems

- **No coordination**: no central ID service required
- **Horizontal scaling**: services generate IDs independently without conflicts
- **Failure isolation**: no dependency on external services
- **Global uniqueness**: maintains uniqueness across geographic distribution

## Performance

NeXID delivers high performance on par with or exceeding Node's native `randomUUID`:

| Implementation     |     IDs/Second | Time sortable | Collision resistance | URL-safe | Coordination-free | Compact |
| ------------------ | -------------: | :-----------: | :------------------: | :------: | :---------------: | :-----: |
| hyperid            |     55,975,228 |               |          ✓           |    ✓     |         ✓         |    ✓    |
| **NeXID.fastId()** | **10,571,431** |     **✓**     |        **✓**         |  **✓**   |       **✓**       |  **✓**  |
| node randomUUID    |      9,532,552 |               |          ✓           |          |         ✓         |         |
| uuid v4            |      9,335,353 |               |          ✓           |          |         ✓         |         |
| nanoid             |      6,953,336 |               |          ✓           |    ✓     |         ✓         |    ✓    |
| uuid v7            |      3,480,979 |       ✓       |          ✓           |          |         ✓         |         |
| uuid v1            |      3,328,294 |       ✓       |          ✓           |          |         ✓         |         |
| ksuid              |         84,179 |       ✓       |          ✓           |    ✓     |         ✓         |    ✓    |
| ulid               |         55,152 |       ✓       |          ✓           |    ✓     |         ✓         |    ✓    |

_Benchmarks on Node.js v22 on Apple Silicon. Results may vary by environment._

## Comparison with alternative solutions

Different identifier systems offer distinct advantages:

| System        | Strengths                                       | Best for                                           |
| ------------- | ----------------------------------------------- | -------------------------------------------------- |
| **NeXID**     | Time-ordered (sec), URL-safe, distributed       | Distributed systems needing time-ordered IDs       |
| **UUID v1**   | Time-based (100ns), uses MAC address            | Legacy systems or specific hardware-tied needs     |
| **UUID v4**   | Pure randomness, standardized, widely adopted   | Systems prioritizing collision resistance          |
| **UUID v7**   | Time-ordered (ms), index locality, sortable     | Modern systems prioritizing time-based sorting     |
| **ULID**      | Time-ordered (ms), URL-safe (Base32), monotonic | Apps needing sortable IDs with ms precision        |
| **nanoid**    | Compact, URL-safe, high performance             | URL shorteners, high-volume generation             |
| **KSUID**     | Time-ordered (sec), URL-safe (Base62), entropy  | Systems needing sortable IDs with sec precision    |
| **Snowflake** | Time-ordered (ms), includes worker/DC IDs       | Large-scale coordinated distributed infrastructure |

UUID v4 remains ideal for pure randomness, nanoid excels when string size is critical, and Snowflake IDs work well for controlled infrastructure.

## Real-world applications

- **High-scale e-commerce**: time-ordering with independent generation enables tracking without coordination.
- **Multi-region data synchronization**: for content replication with eventual consistency, machine identifiers and timestamps simplify conflict resolution.
- **Real-time analytics**: high-performance generation with chronological sorting eliminates separate sequencing.
- **Distributed file systems**: lexicographical sorting optimizes indexes while machine IDs enable sharding.
- **Progressive Web Apps**: client-side generation works offline while maintaining global uniqueness.
- **Time-series data management**: XIDs function as both identifiers and time indices, reducing schema complexity.

## Documentation

For complete API documentation, advanced usage and real-world use cases, see [API reference](docs/api.md) and [Use cases](docs/use-cases.md).

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Create the bundles
npm run bundle

# Run benchmarks
npm run benchmark
```

## Credits

- Original [XID specification](https://github.com/rs/xid) by Olivier Poitrey
- Inspired by MongoDB's ObjectID and Twitter's Snowflake

## License

[MIT License](LICENSE)
