# XIDs use cases

Examples of real-world scenarios where XIDs's unique characteristics provide significant advantages over traditional UUID or other ID generation approaches.

## Why XIDs?

XID identifiers are:

- **Lexicographically sortable**: natural sorting in databases, binary searches, and indexes
- **Time-ordered**: built-in chronological ordering (timestamp is the first component)
- **Compact**: 20 characters vs 36 for UUID (44% smaller)
- **URL-safe**: alphanumeric only (0-9 and a-v), no special characters to escape
- **Universal**: works in Node.js, browsers, Deno, and edge runtimes
- **Fast**: generates 10+ million IDs per second
- **Secure**: uses platform-specific cryptographic random number generation

## E-commerce order management system

**Scenario:** An e-commerce platform needs to track millions of orders across distributed microservices.

**Benefits:**

- Lexicographical sorting makes database queries efficient (e.g., retrieving the latest orders)
- Time ordering allows natural chronological sorting without additional timestamp fields
- Compact format reduces storage requirements when order IDs appear in multiple services/databases
- URL-safe format simplifies sharing order links via email, SMS, etc.

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

const generator: XIDGenerator = NeXID.init();

const orderService = {
  createOrder(userId: string, items: CartItem[]): Promise<Order> {
    const orderId = generator.fastId();

    // Order ID inherently encodes creation timestamp
    // Chronological sorting comes for free
    return persistOrderToDatabase({ id: orderId, userId, items });
  },
};
```

## Distributed content management system

**Scenario:** A CMS with multiple editing nodes needs to synchronize content across servers without conflicts.

**Benefits:**

- IDs can be generated on any node without coordination
- Time ordering helps with conflict resolution strategies
- Lexicographical sorting simplifies merging content from different sources

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

const generator: XIDGenerator = NeXID.init();

function createContent(title: string, body: string): Content {
  const contentId = generator.newId();

  // Each editor can see content in time order without round trips to a central server
  // Natural database indexing means fast retrieval of recent content
  return { id: contentId.toString(), title, body, created: contentId.time };
}
```

## High-throughput event processing system

**Scenario:** An analytics platform needs to process millions of events per second with guaranteed ordering.

**Benefits:**

- High-speed generation (10M+ IDs/sec) supports extreme throughput
- Atomic counter ensures uniqueness even at high request rates
- Time-based ordering simplifies event sequence reconstruction

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

class EventProcessor {
  private idGenerator: XIDGenerator = NeXID.init();

  processEvent(eventData: any) {
    const eventId = this.idGenerator.fastId(); // Using fast path for high throughput

    // Events can be easily reordered chronologically when needed
    // No need for additional sequence numbers
    return publishToKafka({ id: eventId, data: eventData });
  }
}
```

## Collaborative document editing

**Scenario:** A real-time collaborative editor like Google Docs where multiple users make simultaneous edits.

**Benefits:**

- Time-ordered IDs help determine the sequence of changes
- Each client can generate IDs without server coordination
- Compact format reduces network payload size for real-time updates

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/web';

class CollaborativeEditor {
  private idGenerator: XIDGenerator = NeXID.init();

  makeEdit(position: number, content: string) {
    const editId = this.idGenerator.newId();
    // Edits naturally sort by creation time
    // Helps with operational transform algorithms
    const machineHex = Array.from(editId.machineId, b => b.toString(16).padStart(2, '0')).join('');
    return {
      id: editId.toString(),
      position,
      content,
      timestamp: editId.time,
      client: machineHex,
    };
  }
}
```

## URL shortener service

**Scenario:** A URL shortening service that needs to generate millions of short, unique links.

**Benefits:**

- URL-safe format requires no additional encoding
- Fixed 20-character length provides consistency
- Lexicographical ordering helps with analytics and expiration policies

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

class UrlShortener {
  private idGenerator: XIDGenerator = NeXID.init();

  async shortenUrl(originalUrl: string): Promise<string> {
    const shortId = this.idGenerator.fastId();

    await this.database.storeMapping(shortId, originalUrl);

    // Can be used directly in URLs without encoding
    return `https://short.url/${shortId}`;
  }
}
```

## Distributed file system

**Scenario:** A cloud storage platform that needs to manage billions of files across distributed nodes.

**Benefits:**

- Machine ID component helps route requests to the correct storage node
- Time-based sorting simplifies retrieval of recently uploaded files
- Lexicographical ordering improves database index performance

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

class StorageManager {
  private idGenerator: XIDGenerator = NeXID.init();

  async storeFile(fileData: Buffer, metadata: FileMetadata): Promise<string> {
    const fileId = this.idGenerator.newId();

    // Machine ID component can be used to determine storage shard
    const storageNode = determineNodeFromMachineId(fileId.machineId);
    await storageNode.store(fileId.toString(), fileData, metadata);

    return fileId.toString();
  }
}
```

## Notification system with batching

**Scenario:** A messaging platform that needs to batch and deliver notifications efficiently.

**Benefits:**

- Lexicographical ordering enables efficient batch processing of notifications
- Time component allows expiration policies and prioritization
- Machine ID helps with routing to correct notification service

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

class NotificationManager {
  private idGenerator: XIDGenerator = NeXID.init();

  createNotification(userId: string, message: string): Notification {
    const id = this.idGenerator.newId();

    const machineHex = Array.from(id.machineId, b => b.toString(16).padStart(2, '0')).join('');

    // Can efficiently get notifications in time order
    // Batching by machine ID component for optimized delivery
    return {
      id: id.toString(),
      userId,
      message,
      created: id.time,
      routingKey: machineHex,
    };
  }
}
```

## Distributed caching system

**Scenario:** A distributed caching layer that needs to manage cache keys and expiration across nodes.

**Benefits:**

- Time component enables automatic TTL and expiration management
- Machine ID helps with sharding and routing
- Compact format reduces memory consumption for cache keys

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

class DistributedCache {
  private idGenerator: XIDGenerator = NeXID.init();

  async setCacheItem(data: any, ttlSeconds: number = 3600): Promise<string> {
    const cacheKey = this.idGenerator.newId();

    // Timestamp in ID helps with expiration checks
    // Machine ID helps determine cache node
    await this.cacheStore.set(cacheKey.toString(), {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });

    return cacheKey.toString();
  }
}
```

## Database indexing and performance

**Scenario:** A database system that needs efficient indexing on ID columns.

**Benefits:**

- Lexicographical order means B-tree indexes work efficiently
- Time-ordered component improves range query performance
- Compact size reduces index memory footprint

**Example:**

```typescript
// Using NeXID with a SQL database
const createTableSQL = `
CREATE TABLE users (
  id CHAR(20) PRIMARY KEY,  -- NeXID string representation
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE
);

-- Index performs well with NeXID's lexicographical ordering
CREATE INDEX users_created_idx ON users (id);
`;

// Querying recent users is efficient with the natural time ordering
const getRecentUsersSQL = `
SELECT * FROM users
WHERE id > $1        -- Efficient range scan using a threshold XID
ORDER BY id DESC     -- Already sorted by time
LIMIT 100;
`;
```

## Session management

**Scenario:** A web application that needs to track and manage user sessions.

**Benefits:**

- Time component enables automatic session expiration based on creation time
- URL-safe format is cookie and header friendly
- Compact size reduces bandwidth and cookie size

**Example:**

```typescript
import NeXID, { XID, type XIDGenerator } from 'nexid/node';

class SessionManager {
  private idGenerator: XIDGenerator = NeXID.init();

  async createSession(userId: string): Promise<Session> {
    const sessionId = this.idGenerator.newId();

    // Session creation time is inherent in the ID
    const session = {
      id: sessionId.toString(),
      userId,
      created: sessionId.time,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    await this.sessionStore.set(session.id, session);
    return session;
  }

  // Efficient cleanup of expired sessions
  async cleanupExpiredSessions() {
    // Use the natural time ordering of XIDs for efficient range deletion.
    // XIDs created 24+ hours ago will lexicographically precede recent ones.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.sessionStore.deleteOlderThan(cutoff);
  }
}
```

## Log aggregation system

**Scenario:** A logging system that collects logs from multiple services and needs to maintain their chronological order.

**Benefits:**

- Time ordering simplifies log correlation and sequence reconstruction
- Machine ID component helps identify the source
- High performance generation supports high log volumes

**Example:**

```typescript
import NeXID, { type XIDGenerator } from 'nexid/node';

class Logger {
  private idGenerator: XIDGenerator = NeXID.init();

  log(level: string, message: string, metadata: object = {}) {
    const logId = this.idGenerator.newId();

    const logEntry = {
      id: logId.toString(),
      timestamp: logId.time,
      level,
      message,
      source: {
        machineId: Array.from(logId.machineId, b => b.toString(16).padStart(2, '0')).join(''),
        processId: logId.processId,
      },
      metadata,
    };

    // When aggregating logs from multiple sources,
    // they naturally sort in the correct time order
    publishLogEntry(logEntry);
  }
}
```

## Conclusion

XIDs combination of properties makes it ideal for distributed systems, high-throughput applications, and any scenario where ordering, URL safety, or compact representation are important. The examples above demonstrate how its unique characteristics solve common problems in modern application architecture.

By using XIDs, developers can simplify their code, improve performance, and build more resilient distributed systems without the complexity of coordinating ID generation across nodes.

With all that said, I don't take any credit for its original design => https://github.com/rs/xid. I personally think its design is fantastic, and I wanted to make its use in the JavaScript ecosystem more practical.
