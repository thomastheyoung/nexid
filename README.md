# NeXID - Fast, lexicographically sortable unique IDs

[![npm version](https://img.shields.io/npm/v/nexid.svg?style=flat&color=orange)](https://www.npmjs.com/package/nexid)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A TypeScript implementation of globally unique identifiers that are lexicographically sortable, following the [XID specification](https://github.com/rs/xid), originally inspired by Mongo Object ID algorithm. NeXID provides a high-performance solution for generating and working with XIDs across JavaScript runtimes.

> [!TIP]
>
> - For advanced usage and real-world use cases, see [API reference](docs/api.md) and [Use cases](docs/use-cases.md).
> - To see NeXID in action in a web environment, visit the [library's github page](https://thomastheyoung.github.io/nexid).

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

Requires Node.js 20 or >= 22.

## Quick start

```typescript
import NeXID from 'nexid';

// Universal entry point — async (auto-detects environment)
const nexid = await NeXID.init();

// Generate an XID object
const id = nexid.newId();
id.toString(); // "cv37img5tppgl4002kb0"

// High-throughput string-only generation (~30% faster)
const idString = nexid.fastId();
```

You can also resolve the environment separately, then init synchronously:

```typescript
import { resolveEnvironment } from 'nexid';

const { init } = await resolveEnvironment();
const nexid = init();
```

Platform-specific entry points skip detection entirely and are synchronous:

```typescript
import NeXID from 'nexid/deno'; // Deno
import NeXID from 'nexid/node'; // Node.js
import NeXID from 'nexid/web';  // Browser

// No await needed — init is synchronous
const nexid = NeXID.init();
```

## API

### `init(options?)`

Creates an XID generator. Returns `Generator.API`.

```typescript
const nexid = NeXID.init({
  machineId: 'my-service-01', // Override auto-detected machine ID
  processId: 42,              // Override auto-detected process ID (0–65535)
  randomBytes: myCSPRNG,      // Custom (size: number) => Uint8Array
  allowInsecure: false,       // Allow non-cryptographic fallbacks (default: false)
});
```

| Option          | Type                           | Default       | Description                                          |
| --------------- | ------------------------------ | ------------- | ---------------------------------------------------- |
| `machineId`     | `string`                       | Auto-detected | Custom machine identifier string (hashed before use) |
| `processId`     | `number`                       | Auto-detected | Custom process ID, masked to 16-bit                  |
| `randomBytes`   | `(size: number) => Uint8Array` | Auto-detected | Custom CSPRNG implementation                         |
| `allowInsecure` | `boolean`                      | `false`       | When `false`, throws if CSPRNG cannot be resolved    |

### Generator API

Returned by `init()`.

```typescript
nexid.newId();            // Generate XID object (current time)
nexid.newId(new Date());  // Generate XID object with custom timestamp
nexid.fastId();           // Generate XID string directly (faster)

nexid.machineId;  // Hashed machine ID bytes (hex string)
nexid.processId;  // Process ID used by this instance
nexid.degraded;   // true if using insecure fallbacks
```

### XID class

Immutable value object representing a 12-byte globally unique identifier.

#### Factory methods

```typescript
import { XID } from 'nexid';

XID.fromBytes(bytes);  // Create from 12-byte Uint8Array
XID.fromString(str);   // Parse from 20-character string
XID.nilID();           // Create a nil (all-zero) ID
```

#### Instance properties

```typescript
id.bytes;      // Readonly XIDBytes (12-byte Uint8Array)
id.time;       // Date extracted from timestamp component
id.machineId;  // Uint8Array (3-byte machine ID, copy-on-read)
id.processId;  // number (16-bit process ID)
id.counter;    // number (24-bit counter value)
```

#### Instance methods

```typescript
id.toString();      // 20-character base32-hex string
id.toJSON();        // Same as toString() — JSON.stringify friendly
id.isNil();         // true if all bytes are zero
id.equals(other);   // true if identical bytes
id.compare(other);  // -1, 0, or 1 (lexicographic)
```

### Helper functions

```typescript
import { helpers } from 'nexid/core/helpers';

helpers.compare(a, b);       // Lexicographic XID comparison
helpers.equals(a, b);        // XID equality check
helpers.isNil(id);           // Check if XID is nil
helpers.sortIds(ids);        // Sort XID array chronologically
helpers.compareBytes(a, b);  // Lexicographic byte array comparison
```

### Exported types

```typescript
import type { XIDBytes, XIDGenerator, XIDString } from 'nexid';

// XIDBytes      —— branded 12-byte Uint8Array
// XIDString     —— branded 20-character string
// XIDGenerator  —— alias for Generator.API
```

## Architecture

### XID structure

Each XID consists of 12 bytes (96 bits), encoded as 20 characters:

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                         Binary structure (12 bytes)                       │
  ├────────────────────────┬──────────────────┬────────────┬──────────────────┤
  │        Timestamp       │    Machine ID    │ Process ID │      Counter     │
  │        (4 bytes)       │     (3 bytes)    │  (2 bytes) │     (3 bytes)    │
  └────────────────────────┴──────────────────┴────────────┴──────────────────┘
```

### Timestamp (4 bytes)

32-bit unsigned integer representing seconds since Unix epoch. Positioned first in the byte sequence to enable lexicographical sorting by time.

Tradeoff: second-level precision instead of milliseconds allows for 136 years of timestamp space within 4 bytes.

### Machine ID (3 bytes)

24-bit machine identifier derived from platform-specific sources, then hashed:

- **Node.js/Deno**: OS host UUID (`/etc/machine-id` on Linux, `IOPlatformUUID` on macOS, registry `MachineGuid` on Windows), hashed with SHA-256
- **Browsers**: localStorage-persisted random UUID via `crypto.randomUUID()`, with deterministic fingerprint fallback (navigator, screen, timezone), hashed with MurmurHash3
- **Edge**: Adaptive generation based on available platform features

Values remain stable across restarts on the same machine.

### Process ID (2 bytes)

16-bit process identifier:

- **Node.js**: `process.pid` masked to 16-bit
- **Deno**: `Deno.pid` masked to 16-bit
- **Browsers**: Cryptographic random 16-bit value via `crypto.getRandomValues()`

### Counter (3 bytes)

24-bit atomic counter for sub-second uniqueness:

- Thread-safe via `SharedArrayBuffer` + `Atomics` (with WebAssembly and `ArrayBuffer` fallbacks)
- Re-seeded with a fresh 24-bit CSPRNG value on each new second
- 16,777,216 unique IDs per second per process
- Automatic wrapping with 24-bit mask

### Encoding

Base32-hex (0-9, a-v) encoding yields 20-character strings:

- Direct byte-to-character mapping with no padding
- Lexicographically preserves binary order
- Implemented with lookup tables for performance

### Runtime adaptability

The implementation detects its environment and applies appropriate strategies:

- **Server** (Node.js, Deno): hardware identifiers, process IDs, native cryptography, SHA-256
- **Browser**: localStorage persistence, fingerprinting fallback, Web Crypto API, MurmurHash3
- **Edge/Serverless**: adapts to constrained environments with fallback mechanisms

Detected runtimes: Node.js, Browser, Web Worker, Service Worker, Deno, Bun, React Native, Electron (main + renderer), Edge Runtime.

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
WHERE id >= 'cv37ijlxxxxxxxxxxxxxxx' —— Start timestamp
AND id <= 'cv37mogxxxxxxxxxxxxxxx'   —— End timestamp
```

### Distributed systems

- **No coordination**: no central ID service required
- **Horizontal scaling**: services generate IDs independently without conflicts
- **Failure isolation**: no dependency on external services
- **Global uniqueness**: maintains uniqueness across geographic distribution

## Performance

NeXID delivers high performance on par with or exceeding Node's native `randomUUID`:

| Implementation     |    IDs/Second | Time sortable | Collision resistance | URL-safe | Coordination-free | Compact |
| ------------------ | ------------: | :-----------: | :------------------: | :------: | :---------------: | :-----: |
| hyperid            |    53,243,635 |               |          ✓           |    ✓     |         ✓         |    ✓    |
| **NeXID.fastId()** | **9,910,237** |     **✓**     |        **✓**         |  **✓**   |       **✓**       |  **✓**  |
| node randomUUID    |     8,933,319 |               |          ✓           |          |         ✓         |         |
| uuid v4            |     8,734,995 |               |          ✓           |          |         ✓         |         |
| nanoid             |     6,438,064 |               |          ✓           |    ✓     |         ✓         |    ✓    |
| uuid v7            |     3,174,575 |       ✓       |          ✓           |          |         ✓         |         |
| uuid v1            |     2,950,065 |       ✓       |          ✓           |          |         ✓         |         |
| ksuid              |        66,934 |       ✓       |          ✓           |    ✓     |         ✓         |    ✓    |
| ulid               |        48,760 |       ✓       |          ✓           |    ✓     |         ✓         |    ✓    |
| cuid2              |         6,611 |               |          ✓           |    ✓     |         ✓         |    ✓    |

_Benchmarks on Node.js v22 on Apple Silicon. Results may vary by environment._

### Speed and security

For password hashing, slowness is intentional: attackers must brute-force a small input space (human-chosen passwords), so making each attempt expensive is the defense (that's why bcrypt/argon2 exist).

For unique IDs, security comes from entropy (randomness). If an ID has 128 bits of cryptographic randomness:

- An attacker doesn't need your generator, they can enumerate candidates independently at any speed they want
- The search space is 2^128 regardless of how fast you can generate IDs
- Collision resistance is a function of bit-length (birthday bound), not generation throughput
- There's no "entropy-hiding" to break, the output is the random value

## Comparison with alternative solutions

Different identifier systems offer distinct advantages:

| System        | Strengths                                       | Best for                                           |
| ------------- | ----------------------------------------------- | -------------------------------------------------- |
| **NeXID**     | Time-ordered (sec), URL-safe, distributed       | Distributed systems needing time-ordered IDs       |
| **UUID v1**   | Time-based (100ns), uses MAC address            | Systems requiring ns precision with hardware ties  |
| **UUID v4**   | Pure randomness, standardized, widely adopted   | Systems prioritizing collision resistance          |
| **UUID v7**   | Time-ordered (ms), index locality, sortable     | Systems prioritizing time-based sorting            |
| **ULID**      | Time-ordered (ms), URL-safe (Base32), monotonic | Apps needing sortable IDs with ms precision        |
| **nanoid**    | Compact, URL-safe, high performance             | URL shorteners, high-volume generation             |
| **KSUID**     | Time-ordered (sec), URL-safe (Base62), entropy  | Systems needing sortable IDs with sec precision    |
| **cuid2**     | Collision-resistant, horizontal scaling, secure | Security-focused apps needing unpredictable IDs    |
| **Snowflake** | Time-ordered (ms), includes worker/DC IDs       | Large-scale coordinated distributed infrastructure |

UUID v4 remains ideal for pure randomness, nanoid excels when string size is critical, cuid2 prioritizes security over performance, and Snowflake IDs work well for controlled infrastructure.

## Real-world applications

- **High-scale e-commerce**: time-ordering with independent generation enables tracking without coordination.
- **Multi-region data synchronization**: for content replication with eventual consistency, machine identifiers and timestamps simplify conflict resolution.
- **Real-time analytics**: high-performance generation with chronological sorting eliminates separate sequencing.
- **Distributed file systems**: lexicographical sorting optimizes indexes while machine IDs enable sharding.
- **Progressive Web Apps**: client-side generation works offline while maintaining global uniqueness.
- **Time-series data management**: XIDs function as both identifiers and time indices, reducing schema complexity.

## Development

```bash
npm install
npm test        # runs vitest
npm run build   # compile library
npm run bundle  # build standalone bundles (required before benchmark)
npm run benchmark
```

## Credits

- Original [XID specification](https://github.com/rs/xid) by Olivier Poitrey
- Inspired by MongoDB's ObjectID and Twitter's Snowflake

## Good reads

- Great and comprehensive [overview of unique ID generation systems](https://bool.dev/blog/detail/unique-id-generation) from bool.dev blog

## License

[MIT License](LICENSE)
