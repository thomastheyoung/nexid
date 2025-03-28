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
// Universal auto-detection import
import NeXID, { XID } from 'nexid';

// Node.js optimized import (smaller bundle, faster init)
// import NeXID, { XID } from 'nexid/node';

// Web/browser optimized import (smaller bundle, faster init)
// import NeXID, { XID } from 'nexid/web';

// Initialize the generator
const generator = await NeXID.init();

// Generate a new ID
const id = generator.newId();
console.log(id.toString()); // e.g. "cv37img5tppgl4002kb0"

// Generate a string ID directly (fast path)
const idString = generator.fastId();

// Create with custom options (if needed)
const customGenerator = await NeXID.init({
  machineId: 'custom-machine-id',
  processId: 12345
});
```

## Architecture

NeXID is built with a modular architecture that separates core logic from environment-specific implementations:

### Core Components

- **XID**: Immutable value object representing a unique identifier
- **XIDGenerator**: Factory for creating new unique identifiers
- **Encoding**: Base32-hex encoding/decoding optimized for performance
- **Counter**: Thread-safe atomic counter with random seed

### Environment Layer

- **Adapters**: Platform-specific implementations (Node.js, Web)
- **Registry**: Environment feature registry for capability discovery
- **Detection**: Runtime environment detection system

### Entry Points

NeXID provides multiple entry points for optimized tree-shaking and bundle size:

- **Universal**: `import from 'nexid'` - Auto-detects environment
- **Node.js**: `import from 'nexid/node'` - Node.js optimized bundle
- **Deno**: `import from 'nexid/deno'` - Node.js optimized bundle
- **Web**: `import from 'nexid/web'` - Browser optimized bundle

The architecture ensures only the code needed for the target platform is included in the final bundle.

## Technical Details

### XID Structure

Each XID consists of 12 bytes (96 bits), encoded as 20 characters:

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

### Runtime Environment Adaptation

NeXID includes an environment detection system that selects the optimal implementation for different runtimes:

- **Server Environments (Node.js)**
  - Hardware machine ID detection
  - Process ID integration
  - Native crypto for secure randomness

- **Browser Environment**
  - Privacy-preserving device fingerprinting
  - Tab/window context isolation
  - Web Crypto API for random generation

- **Edge/Serverless**
  - Container detection in serverless environments
  - Minimal fingerprinting for edge functions
  - Graceful fallbacks for restricted environments

## Performance

NeXID 1.0 delivers high performance on par with or exceeding Node's native `randomUUID`:

| Library            | Speed (IDs/sec) | Time-based | URL-safe | Fixed length |
| ------------------ | --------------: | :--------: | :------: | :----------: |
| **NeXID.fastId()** |  **10,702,629** |   **✅**   |  **✅**  |    **✅**    |
| **NeXID.newId()**  |  **10,495,276** |   **✅**   |  **✅**  |    **✅**    |
| node randomUUID    |       9,652,435 |     ❌     |    ❌    |      ✅      |
| nanoid             |       7,019,649 |     ❌     |    ✅    |      ✅      |
| uuid v1            |       3,326,415 |     ✅     |    ❌    |      ✅      |
| ksuid              |          80,120 |     ✅     |    ✅    |      ✅      |
| ulid               |          57,568 |     ✅     |    ✅    |      ✅      |

_Note: Benchmarks on Node.js v22 on Apple Silicon. Results may vary by environment._

## Documentation

For complete API documentation and advanced usage, see [API Reference](docs/api.md).

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

## License

[MIT License](LICENSE)
