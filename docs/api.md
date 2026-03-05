# NeXID API reference

NeXID is a high-performance library for generating globally unique, lexicographically sortable identifiers that follow the [XID specification](https://github.com/rs/xid). This document provides detailed API information for developers using the library.

## Table of contents

1. [Installation](#installation)
2. [Entry points](#entry-points)
3. [Basic usage](#basic-usage)
4. [Generator API](#generator-api)
5. [XID class API](#xid-class-api)
6. [Helper functions](#helper-functions)
7. [Advanced configuration](#advanced-configuration)
8. [Type definitions](#type-definitions)
9. [Error handling](#error-handling)

## Installation

```bash
npm install nexid
```

## Entry points

NeXID provides four entry points for optimal tree-shaking and bundle size:

### 1. Universal entry point (auto-detection, async)

```typescript
import NeXID, { XID } from 'nexid';

const generator = await NeXID.init();
```

This entry point automatically detects the current runtime environment and dynamically imports the appropriate adapter. It returns a `Promise` and requires `await`. It's the most flexible option but may result in slightly larger bundle sizes.

Also exports `resolveEnvironment()` for manual two-step initialization:

```typescript
import { resolveEnvironment } from 'nexid';

const { init } = await resolveEnvironment();
const generator = init();
```

### 2. Node.js optimized entry point (sync)

```typescript
import NeXID, { XID } from 'nexid/node';

const generator = NeXID.init();
```

Use this entry point for Node.js applications. It:

- Only includes Node.js-specific code
- Pre-configures with Node.js crypto, OS host ID, and `process.pid`
- Returns synchronously (no `await` needed)
- Allows bundlers to more aggressively tree-shake browser-specific code

### 3. Web/browser optimized entry point (sync)

```typescript
import NeXID, { XID } from 'nexid/web';

const generator = NeXID.init();
```

Use this entry point for browser applications. It:

- Only includes browser-specific code
- Pre-configures with Web Crypto API and browser fingerprinting
- Returns synchronously (no `await` needed)
- Allows bundlers to more aggressively tree-shake Node.js-specific code

### 4. Deno optimized entry point (sync)

```typescript
import NeXID, { XID } from 'nexid/deno';

const generator = NeXID.init();
```

Use this entry point for Deno applications. It:

- Only includes Deno-specific code
- Pre-configures with Node-compat crypto and Deno process ID
- Returns synchronously (no `await` needed)

## Basic usage

```typescript
// Using the universal entry point (async)
import NeXID, { XID } from 'nexid';

// Initialize the generator (required before generating IDs)
const generator = await NeXID.init();

// Generate a new ID
const id = generator.newId();
console.log(id.toString()); // e.g. "cv37img5tppgl4002kb0"

// Generate a string ID directly (fast path, ~30% faster)
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

```typescript
// Using a platform-specific entry point (sync)
import NeXID, { XID } from 'nexid/node';

const generator = NeXID.init();
const id = generator.newId();
```

## Generator API

### Initialization

```typescript
import NeXID, { init } from 'nexid';

// Universal (async) - auto-detects environment
const generator = await NeXID.init();
const generator = await init();
```

```typescript
import NeXID, { init } from 'nexid/node';

// Platform-specific (sync) - no await needed
const generator = NeXID.init();
const generator = init();
```

### Generator methods

| Method                    | Description                                                           | Return type |
| ------------------------- | --------------------------------------------------------------------- | ----------- |
| `newId(timestamp?: Date)` | Creates a new XID, optionally with the specified timestamp            | `XID`       |
| `fastId()`                | Creates a new XID and returns its string representation (~30% faster) | `XIDString` |

### Generator properties

| Property    | Type      | Description                                                           |
| ----------- | --------- | --------------------------------------------------------------------- |
| `machineId` | `string`  | The hashed machine ID bytes (hex-encoded, 6 characters)               |
| `processId` | `number`  | The process ID used by this generator (masked to 16 bits)             |
| `degraded`  | `boolean` | `true` if any security-critical feature is using an insecure fallback |

## XID class API

### Static methods

| Method                             | Description                                                | Return type |
| ---------------------------------- | ---------------------------------------------------------- | ----------- |
| `XID.fromString(str: string)`      | Creates an XID from its 20-character string representation | `XID`       |
| `XID.fromBytes(bytes: Uint8Array)` | Creates an XID from a 12-byte array                        | `XID`       |
| `XID.nilID()`                      | Creates a nil (zero value) XID                             | `XID`       |

### Instance methods

| Method                | Description                                                | Return type |
| --------------------- | ---------------------------------------------------------- | ----------- |
| `toString()`          | Converts the XID to its 20-character string representation | `XIDString` |
| `toJSON()`            | Returns the string representation for JSON serialization   | `XIDString` |
| `equals(other: XID)`  | Compares this XID with another for equality                | `boolean`   |
| `compare(other: XID)` | Lexicographic comparison (-1, 0, or 1)                     | `number`    |
| `isNil()`             | Checks if this is a nil (zero value) XID                   | `boolean`   |

### Instance properties

| Property    | Type         | Description                                     |
| ----------- | ------------ | ----------------------------------------------- |
| `bytes`     | `Uint8Array` | The 12-byte raw representation (read-only copy) |
| `time`      | `Date`       | The timestamp extracted from the XID            |
| `machineId` | `Uint8Array` | The 3-byte machine ID component (copy)          |
| `processId` | `number`     | The process ID component (16-bit)               |
| `counter`   | `number`     | The counter component (24-bit)                  |

## Helper functions

The helpers module provides standalone utility functions for working with XIDs. These are exported from the internal `nexid/core/helpers` module and used by the XID class:

```typescript
import { XID } from 'nexid';

const id1 = XID.fromString('cv37img5tppgl4002kb0');
const id2 = XID.fromString('cv37img5tppgl4002kb1');

// Compare two XIDs using the instance method
const comparison = id1.compare(id2);
// Returns: negative if id1 < id2, 0 if equal, positive if id1 > id2

// Check equality
const areEqual = id1.equals(id2);

// Sort an array of XIDs chronologically
const sorted = [id3, id1, id2].sort((a, b) => a.compare(b));
```

The following standalone functions are available internally but not part of the public package exports:

- `compare(a: XID, b: XID)` — lexicographic comparison
- `equals(a: XID, b: XID)` — byte-level equality check
- `isNil(id: XID)` — checks if all bytes are zero
- `sortIds(ids: XID[])` — returns a new sorted array
- `compareBytes(a: Uint8Array, b: Uint8Array)` — raw byte comparison

## Advanced configuration

### Generator options

```typescript
import { init } from 'nexid/node';

const generator = init({
  // Optional: custom machine identifier string
  machineId: 'custom-machine-id',

  // Optional: specific process ID (number, masked to 16 bits)
  processId: 12345,

  // Optional: custom random source function
  randomBytes: (size: number): Uint8Array => {
    const bytes = new Uint8Array(size);
    // Fill with random values...
    return bytes;
  },

  // Optional: allow insecure fallbacks (default: false)
  // When false, throws if CSPRNG cannot be resolved
  allowInsecure: true,
});
```

### All options

| Option          | Type                           | Default | Description                                             |
| --------------- | ------------------------------ | ------- | ------------------------------------------------------- |
| `machineId`     | `string`                       | auto    | Custom machine identifier (hashed to 3 bytes)           |
| `processId`     | `number`                       | auto    | Custom process ID (masked to 16 bits)                   |
| `randomBytes`   | `(size: number) => Uint8Array` | auto    | Custom CSPRNG function                                  |
| `allowInsecure` | `boolean`                      | `false` | Allow insecure fallbacks for security-critical features |

### Customizing machine ID

By default, NeXID uses platform-specific methods to generate a stable machine ID:

- **Node.js/Deno**: OS host UUID (via `hostid` on macOS/Linux, registry on Windows)
- **Browsers**: Stable fingerprint derived from hardware characteristics

The machine ID is always hashed (SHA-256 on Node.js/Deno, MurmurHash3 on web) before being truncated to 3 bytes, so no system information is disclosed.

You can override this with a custom machine ID:

```typescript
const generator = init({
  machineId: 'my-custom-machine-id',
});
```

### Customizing process ID

Process IDs help differentiate IDs generated from different processes on the same machine:

- **Node.js**: `process.pid`
- **Deno**: `Deno.pid`
- **Browsers**: Tab/window identifier

Override with:

```typescript
const generator = init({
  processId: 12345,
});
```

### Security and degraded mode

By default, NeXID throws if it cannot resolve a cryptographically secure random source. You can opt into degraded mode:

```typescript
const generator = init({ allowInsecure: true });

if (generator.degraded) {
  console.warn('Running with insecure fallbacks');
}
```

The `degraded` property on the generator is `true` when any security-critical feature (currently only `RandomBytes`) fell back to an insecure implementation.

## Type definitions

NeXID provides TypeScript branded types for compile-time safety:

```typescript
// Exported from all entry points
import type { XIDBytes, XIDGenerator, XIDString } from 'nexid';
```

| Type           | Base type              | Description                          |
| -------------- | ---------------------- | ------------------------------------ |
| `XIDBytes`     | `Readonly<Uint8Array>` | Branded 12-byte XID binary form      |
| `XIDString`    | `Readonly<string>`     | Branded 20-character XID string form |
| `XIDGenerator` | `Generator.API`        | The generator interface type alias   |

### Generator types (internal)

```typescript
import type { Generator } from 'nexid/types/xid-generator';

const options: Generator.Options = {
  machineId: 'custom-id',
  processId: 1234,
  randomBytes: size => new Uint8Array(size),
  allowInsecure: false,
};

const generator: Generator.API = init(options);
```

## Error handling

NeXID throws standard `Error` instances in the following cases:

### Initialization errors

| Condition                         | Error message                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| CSPRNG unavailable (default mode) | `nexid: Failed to resolve secure implementation for RandomBytes. Set { allowInsecure: true } to allow insecure fallbacks.` |

### Parsing errors

| Condition                          | Error message                                   |
| ---------------------------------- | ----------------------------------------------- |
| `fromString()` with wrong length   | `Invalid id length`                             |
| `fromString()` with invalid chars  | `Invalid string id (must be 20 chars, 0-9 a-v)` |
| `fromBytes()` with non-Uint8Array  | `ID is not a Uint8Array`                        |
| `fromBytes()` with wrong length    | `Invalid id length`                             |
| `decode()` with invalid character  | `Invalid character '...' at position ...`       |
| `decode()` consistency check fails | `XID consistency check failed`                  |

### Generation errors

| Condition                   | Error message                    |
| --------------------------- | -------------------------------- |
| `newId()` with invalid Date | `Invalid Date passed to newId()` |
