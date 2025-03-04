# Migrating to NeXID

This guide helps you migrate from other ID generation libraries to NeXID.

## From UUID

UUID is a widely used standard, but it has some limitations that NeXID addresses:

### Key Differences

- **Size**: UUID is 36 characters, NeXID is 20 characters (44% smaller)
- **Sortability**: UUID v4 is random, NeXID is time-sortable
- **URL safety**: UUIDs contain hyphens, NeXID is fully URL-safe

### Migration Steps

1. Install NeXID:

```bash
npm install nexid
```

2. Replace UUID imports:

```typescript
// Before
import { v4 as uuidv4 } from 'uuid';

// After
import NeXID from 'xid';
```

3. Update ID generation:

```typescript
// Before
const id = uuidv4();

// After
const id = newId().toString();
```

4. If you need time-based IDs (UUID v1):

```typescript
// Before
import { v1 as uuidv1 } from 'uuid';
const id = uuidv1();

// After
import { newId } from 'xid';
const id = newId().toString();
```

5. Update database schemas/code that expects UUID format:
   - Change VARCHAR(36) to VARCHAR(20) for storage efficiency
   - Update any validation logic that expects the UUID format
   - Consider UUID → NeXID conversion functions for transition periods

### UUID Parsing Conversion Helper

```typescript
import NeXID from 'nexid';
import { v4 as uuidv4, parse as uuidParse } from 'uuid';

// Helper function to convert UUID to NeXID during migration
function convertUuidToNeXID(uuid: string) {
  // This is just for transition, real conversion would need
  // a more sophisticated approach to maintain uniqueness
  const uuidBytes = uuidParse(uuid);
  const NeXIDBytes = new Uint8Array(12);

  // Copy timestamp-like portion from UUID
  NeXIDBytes.set(uuidBytes.slice(0, 4), 0);

  // Copy other portions to maintain uniqueness
  NeXIDBytes.set(uuidBytes.slice(4, 9), 4);
  NeXIDBytes.set(uuidBytes.slice(10, 13), 9);

  return NeXIDFromString(bytesToBase32Hex(xidBytes));
}
```

## From nanoid

nanoid is fast and compact but lacks time-based sorting.

### Key Differences

- **Sortability**: nanoid is random, NeXID is time-sortable
- **Structure**: nanoid is purely random, NeXID has a defined structure
- **Determinism**: NeXID provides deterministic generation with the same timestamp

### Migration Steps

1. Replace imports:

```typescript
// Before
import { nanoid } from 'nanoid';

// After
import NeXID from 'xid';
```

2. Replace ID generation:

```typescript
// Before
const id = nanoid();

// After
const id = NeXID.newId().toString();
```

3. If you're using custom length nanoids, consider the implications:

```typescript
// Before
const id = nanoid(10); // Shorter ID with higher collision risk

// After - NeXID has a fixed 20-char length with lower collision risk
const id = NeXID.newId().toString();
```

## From ULID/KSUID

These libraries are conceptually similar to NeXID with slight differences.

### Key Differences

- **Performance**: NeXID is significantly faster
- **Size**: NeXID (20 chars) is more compact than ULID (26) and KSUID (27)
- **Ordering**: ULID/KSUID provide lexicographic ordering, NeXID provides time-based ordering

### Migration Steps

#### From ULID:

```typescript
// Before
import { ulid } from 'ulid';
const id = ulid();

// After
import NeXID from 'nexid';
const id = NeXID.newId().toString();
```

#### From KSUID:

```typescript
// Before
import KSUID from 'ksuid';
const id = await KSUID.random();

// After
import NeXID from 'xid';
const id = NeXID.newId().toString();
```

## From MongoDB ObjectId

If you're using MongoDB's ObjectId and want to standardize on NeXID:

### Key Differences

- **Format**: ObjectId uses 24-character hex, NeXID uses 20-character base32-hex
- **Structure**: Both have similar structure (timestamp + machine + process + counter)
- **Encoding**: ObjectId uses hex, NeXID uses base32-hex (more compact)

### Migration Steps

```typescript
// Before
import { ObjectId } from 'mongodb';
const id = new ObjectId();

// After
import NeXID from 'nexid';
const id = NeXID.newId().toString();
```

## Best Practices for Migration

1. **Gradual Adoption**:

   - Use NeXID for new records
   - Maintain compatibility with old IDs during transition

2. **Database Considerations**:

   - Update column types for better storage efficiency
   - Create indexes optimized for NeXID's format
   - Consider storing the raw bytes (12 bytes) for maximum efficiency

3. **API Compatibility**:

   - Document the change in ID format
   - Consider version-aware endpoints during transition
   - Provide helpers for clients to handle both formats

4. **Performance Optimization**:
   - Set up custom machine IDs for distributed systems
   - Consider using the custom generator for special cases

## Common Migration Challenges

### Challenge: Existing data with old ID format

**Solution**: Create a mapping table or function that can translate between formats during the transition period.

### Challenge: Clients expect specific ID format

**Solution**: Provide backward compatibility layer that can convert NeXID to the expected format when needed.

### Challenge: ID length validation in existing systems

**Solution**: Update validation rules and schema constraints to accommodate NeXID's 20-character format.

### Challenge: Sorting behavior changes

**Solution**: Document the new sorting behavior and update any code that relies on specific ID ordering.

## Conclusion

Migrating to NeXID provides numerous benefits including better performance, smaller size, and time-based sorting. The migration process can be straightforward for new projects, while existing systems may require a more gradual approach.

For assistance or questions about migration, please open an issue on the GitHub repository.
