# NeXID API Reference

NeXID is a high-performance library for generating globally unique, lexicographically sortable identifiers that follow the [XID specification](https://github.com/rs/xid). This document provides detailed API information for developers using the library.

## Table of Contents

1. [Installation](#installation)
2. [Entry Points](#entry-points)
3. [Basic Usage](#basic-usage)
4. [Generator API](#generator-api)
5. [XID Class API](#xid-class-api)
6. [Helper Functions](#helper-functions)
7. [Advanced Configuration](#advanced-configuration)
8. [Type Definitions](#type-definitions)
9. [Error Handling](#error-handling)

## Installation

```bash
npm install nexid
```

## Entry Points

NeXID provides three different entry points for optimal tree-shaking and bundle size:

### 1. Universal Entry Point (Auto-detection)

```typescript
import NeXID, { XID } from 'nexid';
```

This entry point automatically detects the current runtime environment and loads the appropriate adapter. It's the most flexible option but may result in slightly larger bundle sizes.

### 2. Node.js Optimized Entry Point

```typescript
import NeXID, { XID } from 'nexid/node';
```

Use this entry point for Node.js applications. It:

- Only includes Node.js-specific code
- Pre-configures the generator with NodeAdapter
- Skips environment detection for faster initialization
- Allows bundlers to more aggressively tree-shake browser-specific code

### 3. Web/Browser Optimized Entry Point

```typescript
import NeXID, { XID } from 'nexid/web';
```

Use this entry point for browser applications. It:

- Only includes browser-specific code
- Pre-configures the generator with WebAdapter
- Skips environment detection for faster initialization
- Allows bundlers to more aggressively tree-shake Node.js-specific code

## Basic Usage

```typescript
// Import the library (use context-specific imports for optimized bundles)
import NeXID, { XID } from 'nexid';

// Initialize the generator (required before generating IDs)
const generator = await NeXID.init();

// Generate a new ID
const id = generator.newId();
console.log(id.toString()); // e.g. "cv37img5tppgl4002kb0"

// Generate a string ID directly (fast path)
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

## Generator API

### Initialization

```typescript
// Initialize with default settings
const generator = await NeXID.init();

// Or use the named export
import { init } from 'nexid';
const generator = await init();
```

### Generator Methods

| Method                    | Description                                                      | Return Type |
| ------------------------- | ---------------------------------------------------------------- | ----------- |
| `newId(timestamp?: Date)` | Creates a new XID, optionally with the specified timestamp       | `XID`       |
| `fastId()`                | Creates a new XID and returns its string representation (faster) | `string`    |

### Generator Properties

| Property    | Type     | Description                                    |
| ----------- | -------- | ---------------------------------------------- |
| `machineId` | `string` | The original machine ID used by this generator |
| `processId` | `number` | The original process ID used by this generator |

## XID Class API

### Static Methods

| Method                             | Description                                   | Return Type |
| ---------------------------------- | --------------------------------------------- | ----------- |
| `XID.fromString(str: string)`      | Creates an XID from its string representation | `XID`       |
| `XID.fromBytes(bytes: Uint8Array)` | Creates an XID from a 12-byte array           | `XID`       |
| `XID.nilID()`                      | Creates a nil (zero value) XID                | `XID`       |
| `XID.isValid(str: string)`         | Checks if a string is a valid XID format      | `boolean`   |

### Instance Methods

| Method               | Description                                              | Return Type |
| -------------------- | -------------------------------------------------------- | ----------- |
| `toString()`         | Converts the XID to its string representation            | `string`    |
| `toJSON()`           | Returns the string representation for JSON serialization | `string`    |
| `equals(other: XID)` | Compares this XID with another for equality              | `boolean`   |
| `isNil()`            | Checks if this is a nil (zero value) XID                 | `boolean`   |

### Instance Properties

| Property    | Type         | Description                                |
| ----------- | ------------ | ------------------------------------------ |
| `bytes`     | `Uint8Array` | The 12-byte raw representation (read-only) |
| `time`      | `Date`       | The timestamp extracted from the XID       |
| `machineId` | `Uint8Array` | The 3-byte machine ID component            |
| `processId` | `number`     | The process ID component                   |
| `counter`   | `number`     | The counter component                      |

## Helper Functions

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

## Advanced Configuration

### Custom Generator Options

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

### Customizing Machine ID

By default, NeXID uses platform-specific methods to generate a stable machine ID:

- On servers: Hardware identifiers or filesystem information
- In browsers: Privacy-respecting device fingerprinting

You can override this with a custom machine ID:

```typescript
const generator = await init({
  machineId: 'my-custom-machine-id',
});
```

### Customizing Process ID

Process IDs help differentiate IDs generated from different processes on the same machine:

- On Node.js: Uses the actual process ID
- In browsers: Uses a tab/window identifier

Override with:

```typescript
const generator = await init({
  processId: 12345,
});
```

## Type Definitions

NeXID provides TypeScript type definitions for compile-time safety:

```typescript
import { Generator } from 'nexid/types/xid-generator';

// Generator options
const options: Generator.Options = {
  machineId: 'custom-id',
  processId: 1234,
  randomBytes: (size) => new Uint8Array(size),
};

// Generator API
const generator: Generator.API = await init(options);
```
