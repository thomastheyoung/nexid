# NeXID Benchmark Results

This document presents benchmark results comparing NeXID with other popular ID generation libraries.

## Test Environment

- **Node.js**: v22.14.0
- **Machine**: Apple Silicon (Macbook Pro M1 Max, 64Gb RAM)
- **Date**: March 2025
- **Methodology**: Generation of 1,000,000 IDs with each library

## Performance Results

| Library         | Speed (IDs/sec) | Lexicographically Sortable | Time-based | URL-safe | Fixed length | Size (chars) |
| --------------- | --------------: | :------------------------: | :--------: | :------: | :----------: | :----------: |
| hyperid         |      53,718,122 |             ❌             |     ❌     |    ❌    |      ❌      |      24      |
| node randomUUID |       9,360,652 |             ❌             |     ❌     |    ❌    |      ✅      |      36      |
| uuid v4         |       9,118,251 |             ❌             |     ❌     |    ❌    |      ✅      |      36      |
| nanoid          |       6,821,007 |             ❌             |     ❌     |    ✅    |      ✅      |      21      |
| uuid v1         |       3,092,987 |             ❌             |     ✅     |    ❌    |      ✅      |      36      |
| **NeXID**       |   **3,019,350** |             ✅             |     ✅     |    ✅    |      ✅      |    **20**    |
| shortid         |         694,467 |             ❌             |     ❌     |    ✅    |      ❌      |   variable   |
| ksuid           |          80,564 |             ✅             |     ✅     |    ✅    |      ✅      |      27      |
| ulid            |          54,114 |             ✅             |     ✅     |    ✅    |      ✅      |      26      |

## Sample IDs

| Library         | Sample ID                              | Length | Bytes |
| --------------- | -------------------------------------- | -----: | ----: |
| **NeXID**       | `cv37u705tppkluj9ro7g`                 | **20** |**20** |
| uuid v1         | `4f58ae90-f8ac-11ef-9bb5-edd63dc69670` |     36 |    36 |
| uuid v4         | `7ab9f36c-f795-4f2e-a143-9818584669ce` |     36 |    36 |
| node randomUUID | `89e5d415-f0c6-491a-923b-1782f4b9f98b` |     36 |    36 |
| ulid            | `01JNFMM1ZW0K2TVX6Q65YZQDR4`           |     26 |    26 |
| nanoid          | `kou1dAEdMXBxj5i_82a7-`                |     21 |    21 |
| hyperid         | `P3ZHfRnLTUuRSxTJf0GgYg/0`             |     24 |    24 |
| shortid         | `4UTrvt7U_`                            |      9 |     9 |
| ksuid           | `2tpseOLlyt94DpNIUVqu8mSP7h0`          |     27 |    27 |

## Analysis

### Feature Comparison

NeXID provides the best overall feature set:

- **Lexicographical sorting**: Critical for databases, binary searches, and sequential access
- **Time-based order**: Ensures chronological access patterns
- **URL safety**: No special characters that require encoding
- **Fixed length**: Simplifies storage and UI design
- **Compact size**: More efficient storage and transmission

### Memory Usage

NeXIDs are almost half the size of UUIDs (20 chars vs 36), resulting in significantly reduced memory usage in large datasets, API responses, and database storage.

For a dataset with 10 million IDs:

- UUID v4: ~360MB
- NeXID: ~200MB
- **Savings**: ~160MB (44% reduction)

This size difference becomes particularly important in:

- Large-scale databases
- High-frequency API responses
- Applications with memory constraints
- Network-bound applications

## Use Case Recommendations

1. **Distributed Systems**: NeXID is ideal for distributed systems where coordination-free ID generation is required while maintaining lexicographical sortability.

2. **Time-Series Data**: The time-ordering property makes NeXID a good choice for time-series data, logs, and events.

3. **High-Performance Applications**: With over 3 million IDs per second, NeXID is suitable for high-throughput systems.

4. **API Development**: The URL-safe format and compact size make NeXID ideal for RESTful APIs and microservices.

## Conclusions

1. **For maximum speed**: If chronological sorting is not needed and you don't mind non-URL-safe characters, hyperid is the fastest option.

2. **For cryptographic applications**: All libraries except shortid provide cryptographically strong random values.

3. **For general purpose use**: NeXID provides a great balance of features while maintaining excellent performance.

4. **For lexicographical and time-based sorting with URL safety**: NeXID, ULID, and KSUID all excel, with NeXID offering a good balance between performance and smallest size.

XID is meant to provide a healthy balance of performance, compact size, lexicographical sorting, time-based ordering, and URL safety. For most applications, it represents a good choice among the tested libraries.
