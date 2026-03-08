# Offensive word filter

XIDs are encoded using a base32-hex alphabet (`0-9`, `a-v`), which means generated IDs can occasionally spell out offensive words as substrings. The offensive word filter is an opt-in mechanism that detects and mitigates these occurrences.

This document explains how the filter works, its API, and — importantly — its limitations. The filter is **best-effort**: it eliminates the most common and persistent cases, but cannot guarantee that every generated ID will be free of offensive substrings.

## Table of contents

1. [Quick start](#quick-start)
2. [API reference](#api-reference)
3. [How it works](#how-it-works)
4. [XID anatomy and the encoding problem](#xid-anatomy-and-the-encoding-problem)
5. [What the filter can and cannot fix](#what-the-filter-can-and-cannot-fix)
6. [Limitations](#limitations)
7. [Design rationale](#design-rationale)

## Quick start

```typescript
import { init } from 'nexid/node';

const generator = init({ filterOffensiveWords: true });

const id = generator.fastId(); // offensive substrings are filtered
```

## API reference

### Generator options

| Option                 | Type       | Default | Description                                                  |
| ---------------------- | ---------- | ------- | ------------------------------------------------------------ |
| `filterOffensiveWords` | `boolean`  | `false` | Enable filtering using the built-in offensive word blocklist |
| `offensiveWords`       | `string[]` | `[]`    | Additional words to block alongside the built-in list        |
| `maxFilterAttempts`    | `number`   | `10`    | Max retry attempts before accepting the ID (clamped 0–100)   |

### Configuration examples

```typescript
// Built-in blocklist only
const gen = init({ filterOffensiveWords: true });

// Extend with custom terms
const gen2 = init({
  filterOffensiveWords: true,
  offensiveWords: ['myterm', 'brandname'],
});

// Increase retry budget
const gen3 = init({
  filterOffensiveWords: true,
  maxFilterAttempts: 20,
});
```

### Exports

All entry points export `BLOCKED_WORDS` (`readonly string[]`) — the raw built-in blocklist of 57 curated offensive English words. Useful for inspection or building custom filtering logic outside the generator.

```typescript
import { BLOCKED_WORDS } from 'nexid/node';

console.log(BLOCKED_WORDS.length); // 57
```

### Built-in blocklist criteria

Words are included in the built-in blocklist when they meet all of:

- 3+ characters (shorter words cause excessive false positives)
- Composed entirely of characters in the base32-hex alphabet (`0-9`, `a-v`)
- Universally considered offensive in English

Custom words added via `offensiveWords` are lowercased and regex-escaped internally. Words containing characters outside the base32-hex alphabet are accepted but will never match a generated ID.

## How it works

The filter operates at two stages: **construction time** and **generation time**.

### Construction-time sanitization

When the generator is created with `filterOffensiveWords: true`, it checks whether the fixed region of the encoded ID (characters 7–13, determined by the machine ID and process ID) contains an offensive word. Since these bytes never change for the lifetime of the generator, an offensive word here would appear in **every single generated ID**.

If an offensive word is detected, the generator re-hashes the machine ID with incremental salts until the fixed region is clean. The machine ID is already a hash of the system identifier, so any salted hash is equally valid — this does not affect uniqueness, sorting, or spec compliance.

### Generation-time retries

At generation time, each produced ID is checked against the filter. If it matches, the generator increments the counter and tries again, up to `maxFilterAttempts` times. Each retry consumes one counter value.

The retry loop is **position-aware**: if the offensive match falls entirely within characters 0–13 (the timestamp and fixed regions), the loop bails out immediately. Only the counter region (characters 14–19) changes between retries, so retrying a match outside that region would waste counter values with no effect.

If the retry budget is exhausted, the last generated ID is returned regardless (best-effort).

## XID anatomy and the encoding problem

An XID is 12 bytes, encoded to a 20-character base32-hex string. Each character encodes 5 bits, with bits straddling byte boundaries. The 12 bytes come from four components:

```
Bytes 0–3:   Timestamp   (seconds since Unix epoch)
Bytes 4–6:   Machine ID  (3 bytes from a hash of the host identifier)
Bytes 7–8:   Process ID  (16-bit process or context identifier)
Bytes 9–11:  Counter     (24-bit monotonically increasing counter)
```

These bytes map to encoded characters as follows:

```
Chars 0–6:   Timestamp region    (bytes 0–3, with char 6 sharing bits with byte 4)
Chars 7–13:  Fixed region        (bytes 4–8: machine ID + process ID)
Chars 14–19: Counter region      (bytes 9–11, with char 14 sharing bits with byte 8)
```

The critical insight: **only the counter region changes between consecutive IDs within the same second.** The timestamp region changes with time, and the fixed region never changes for a given generator instance.

### Character change rates

Each encoded character depends on specific bits of the timestamp. Higher-order bits change slowly:

| Char  | Source                       | Changes every                   |
| ----- | ---------------------------- | ------------------------------- |
| 0     | Timestamp bits 27–31         | ~4.3 years                      |
| 1     | Timestamp bits 22–26         | ~48 days                        |
| 2     | Timestamp bits 17–21         | ~1.5 days                       |
| 3     | Timestamp bits 12–16         | ~68 minutes                     |
| 4     | Timestamp bits 7–11          | ~2 minutes                      |
| 5     | Timestamp bits 2–6           | ~4 seconds                      |
| 6     | Timestamp bits 0–1 + machine | ~1 second                       |
| 7–13  | Machine ID + process ID      | **Never** (fixed per generator) |
| 14    | Process ID + counter         | Every ID                        |
| 15–19 | Counter                      | Every ID                        |

## What the filter can and cannot fix

### Fixed region (chars 7–13) — fully mitigated

An offensive word landing entirely within characters 7–13 would appear in every ID produced by the generator, forever. This is handled at **construction time** by re-salting the machine ID hash until the region is clean.

- **Effectiveness**: near-certain. The probability of 100 consecutive salts all producing offensive words in a 7-character region is astronomically low.
- **Impact on spec compliance**: none. The machine ID is already a hash; a salted hash is equally valid. Monotonic ordering, uniqueness, and K-ordering are all preserved.

### Counter region (chars 14–19) — mitigated by retry

An offensive word in the counter region can be resolved by incrementing the counter and retrying. This is the original retry mechanism.

- **Effectiveness**: high. Each retry shifts 6 characters. With a default budget of 10 attempts and 32 possible values per character, the probability of all attempts matching is negligible.
- **Impact on spec compliance**: each retry consumes one counter value, slightly reducing the counter space for that second. With 16M counter values per second and a budget of 10–100, the impact is negligible.

### Timestamp region (chars 0–6) — not fully mitigated

This is the fundamental limitation. The timestamp is the timestamp — it cannot be changed without breaking monotonic ordering and time accuracy. The filter handles this region as follows:

- **Generation-time**: the position-aware retry detects that the match is outside the counter region and bails immediately, avoiding wasted counter values.
- **Self-healing**: the word will disappear on its own when the relevant timestamp bits change. How quickly depends on which characters are affected.

#### Worst-case persistence by position

| Match position | Persistence       | Example                        |
| -------------- | ----------------- | ------------------------------ |
| Chars 0–2      | Up to ~1.5 days   | Depends on bit 17 rolling over |
| Chars 1–3      | Up to ~68 minutes | Depends on bit 12 rolling over |
| Chars 2–4      | Up to ~2 minutes  | Depends on bit 7 rolling over  |
| Chars 3–5      | Up to ~4 seconds  | Depends on bit 2 rolling over  |
| Chars 4–6      | Up to ~1 second   | Depends on bit 0 rolling over  |

#### Probability of occurrence

For any specific 3-letter word to appear at a given position, the probability is 1 in 32^3 = 32,768. With ~57 blocked words (of varying lengths), the probability of _any_ word matching at a given position per epoch is roughly 0.03–0.2%, depending on the word lengths and position.

The chance is low, but when it happens at a slow-changing position (chars 0–2), it persists for over a day. For a high-volume system generating user-visible IDs, this may be unacceptable.

## Limitations

To summarize the filter's guarantees and non-guarantees:

**The filter guarantees:**

- The fixed region (chars 7–13) will never contain an offensive word from the blocklist, for the lifetime of the generator.
- Counter retries will not be wasted on matches that retrying cannot fix.
- The filter is zero-cost when disabled — generators without `filterOffensiveWords: true` pay no overhead.

**The filter does not guarantee:**

- Offensive words in the timestamp region (chars 0–6) are **not prevented**. They are rare but can persist for seconds to days depending on their position.
- Words spanning the timestamp–machine boundary (chars 5–8) depend partly on timestamp bits and are only partially mitigated by the construction-time sanitization.
- The filter is English-only and limited to the curated blocklist. Offensive terms in other languages, or new terms not in the list, are not covered unless added via `offensiveWords`.
- The retry mechanism is best-effort. If `maxFilterAttempts` is exhausted, the ID is returned regardless.

## Design rationale

### Why not change the timestamp?

Advancing the timestamp would fix offensive words in the timestamp region, but it breaks two core guarantees:

1. **Time accuracy** — IDs would encode a future timestamp, making time-based queries unreliable.
2. **Monotonic ordering** — advancing by more than a second creates gaps and cross-generator ordering anomalies.

For low-order characters (4–6), a 1–4 second advance would be tolerable. For high-order characters (0–2), the required advance (hours to days) is unacceptable. Rather than introduce a partial, hard-to-reason-about fix, the filter accepts this as a known limitation.

### Why not change the encoding alphabet?

A different base32 alphabet could be chosen to avoid offensive words entirely, but:

- It would break interoperability with the XID spec and other implementations.
- Lexicographic sort order depends on the specific alphabet mapping.
- It would be a breaking change for existing users.

### Why re-salt the machine ID instead of the process ID?

The machine ID is already a hash of the system identifier — any hash output is equally valid. The process ID is a raw system value with potential operational meaning (e.g., matching OS `pid`). Re-salting the machine ID is invisible to the user and has no side effects beyond changing the `machineId` hex string exposed on the generator.
