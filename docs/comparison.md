# ID Generation Libraries Comparison

This document compares different ID generation libraries to help you choose the right one for your needs.

## Library Overview

| Library     | Description                              | Main Appeal           |
| ----------- | ---------------------------------------- | --------------------- |
| **NeXID**   | Time-sortable, compact, URL-safe IDs     | All-around balance    |
| **UUID**    | Industry standard universally unique IDs | Broad compatibility   |
| **ULID**    | Lexicographically sortable, time-based   | Strict ordering       |
| **KSUID**   | K-Sortable IDs with more entropy         | Collision resistance  |
| **nanoid**  | Tiny, URL-safe IDs                       | Small size + speed    |
| **hyperid** | Extremely fast ID generation             | Performance           |
| **shortid** | Very short IDs                           | Shortest possible IDs |

## Feature Matrix

| Feature                 | NeXID | UUID v4 | UUID v1 | ULID | KSUID | nanoid | hyperid | shortid |
| ----------------------- | :---: | :-----: | :-----: | :--: | :---: | :----: | :-----: | :-----: |
| Time-based              |  ✅   |   ❌    |   ✅    |  ✅  |  ✅   |   ❌   |   ❌    |   ❌    |
| URL-safe                |  ✅   |   ❌    |   ❌    |  ✅  |  ✅   |   ✅   |   ❌    |   ✅    |
| Fixed length            |  ✅   |   ✅    |   ✅    |  ✅  |  ✅   |   ✅   |   ❌    |   ❌    |
| Compact (<30 chars)     |  ✅   |   ❌    |   ❌    |  ✅  |  ✅   |   ✅   |   ✅    |   ✅    |
| No central coordination |  ✅   |   ✅    |   ✅    |  ✅  |  ✅   |   ✅   |   ✅    |   ✅    |
| Language-agnostic spec  |  ✅   |   ✅    |   ✅    |  ✅  |  ✅   |   ❌   |   ❌    |   ❌    |
| Lexicographic order     |  ✅   |   ❌    |   ❌    |  ✅  |  ✅   |   ❌   |   ❌    |   ❌    |
| Monotonicity            |  ✅   |   ❌    |   ✅    |  ✅  |  ✅   |   ❌   |   ❌    |   ❌    |
| Cryptographic random    |  ✅   |   ✅    |   ✅    |  ✅  |  ✅   |   ✅   |   ✅    |   ❌    |
| High performance        |  ✅   |   ✅    |   ✅    |  ❌  |  ❌   |   ✅   |   ✅    |   ❌    |

## Format Details

| Library     | Format                                                  | Example                                |   Length |
| ----------- | ------------------------------------------------------- | -------------------------------------- | -------: |
| **NeXID**   | 4B time + 3B machine + 2B pid + 3B counter (base32-hex) | `cv37u705tppkluj9ro7g`                 |       20 |
| **UUID v4** | 16B with specific bit patterns (hex)                    | `7ab9f36c-f795-4f2e-a143-9818584669ce` |       36 |
| **UUID v1** | Time + node + random (hex)                              | `4f58ae90-f8ac-11ef-9bb5-edd63dc69670` |       36 |
| **ULID**    | 6B time + 10B random (Crockford's Base32)               | `01JNFMM1ZW0K2TVX6Q65YZQDR4`           |       26 |
| **KSUID**   | 4B time + 16B random (base62)                           | `2tpseOLlyt94DpNIUVqu8mSP7h0`          |       27 |
| **nanoid**  | Customizable random (URL-safe alphabet)                 | `kou1dAEdMXBxj5i_82a7-`                |       21 |
| **hyperid** | Server ID + counter (non-URL-safe)                      | `P3ZHfRnLTUuRSxTJf0GgYg/0`             |       24 |
| **shortid** | Custom algorithm (URL-safe)                             | `4UTrvt7U_`                            | variable |

## Performance Analysis

Libraries ordered by speed (fastest to slowest):

1. **hyperid**: 53,718,122 IDs/sec - Extremely fast, but lacks key features
2. **randomUUID/UUID v4**: ~9,000,000 IDs/sec - Good performance, widely used
3. **nanoid**: 6,821,007 IDs/sec - Great balance for random IDs
4. **UUID v1/NeXID**: ~3,000,000 IDs/sec - Best performance for time-ordered IDs
5. **shortid**: 694,467 IDs/sec - Focused on small size at cost of performance
6. **KSUID/ULID**: 50,000-80,000 IDs/sec - Feature-rich but significantly slower

## Size Considerations

ID size directly impacts:

- Database storage requirements
- Network payload size
- Memory usage
- Readability in logs and debugging

For 10 million IDs:

- UUID: ~360MB
- KSUID/ULID: ~260-270MB
- nanoid: ~210MB
- NeXID: ~200MB
- shortid: ~90MB

## Library Strengths and Weaknesses

### NeXID

✅ **Strengths**: Good balance of features, time-sorted, compact, URL-safe  
❌ **Weaknesses**: Not as widely adopted as UUID

### UUID

✅ **Strengths**: Industry standard, broad support, high entropy  
❌ **Weaknesses**: Verbose, not URL-safe, v4 not time-sorted

### ULID

✅ **Strengths**: Lexicographically sortable, good spec  
❌ **Weaknesses**: Longer than NeXID, slower performance

### KSUID

✅ **Strengths**: Higher entropy, time-sortable  
❌ **Weaknesses**: Larger size, slower performance

### nanoid

✅ **Strengths**: Fast, customizable, compact  
❌ **Weaknesses**: Not time-sorted

### hyperid

✅ **Strengths**: Extremely fast  
❌ **Weaknesses**: Not URL-safe, variable length, non-standard format

### shortid

✅ **Strengths**: Very short  
❌ **Weaknesses**: Slower, variable length, higher collision risk

## Choosing the Right Library

### Choose NeXID when you need:

- Time-ordered IDs with good performance
- Compact representation
- URL-safe format
- A balance of all features

### Choose UUID when you need:

- Industry standard compatibility
- Existing system integration
- Highest entropy (v4)
- MAC address inclusion (v1)

### Choose ULID/KSUID when you need:

- Strict lexicographic ordering
- More entropy bits than NeXID
- Formal specification compliance

### Choose nanoid/hyperid when you need:

- Maximum performance
- Random IDs only
- No time-based sorting

### Choose shortid when you need:

- Absolute minimum ID length
- Human-readable/friendly IDs

## Conclusion

NeXID offers the best overall balance of features for most modern applications, especially web services, APIs, and distributed systems. Its combination of time-ordering, compactness, and performance make it an excellent default choice.

However, specific requirements might dictate using alternatives:

- Legacy system integration → UUID
- Absolute maximum performance → hyperid
- Strict lexicographic ordering → ULID
- Minimum possible length → shortid
