# Changelog

## 2.0.0

### Breaking changes

- **Sync initialization** — Platform entry points (`nexid/node`, `nexid/web`, `nexid/deno`) now return `Generator.API` directly instead of `Promise<Generator.API>`. No more `await` needed at import time. The universal `nexid` entry point remains async (dynamic imports).
- **`newId()` throws on invalid Date** — Previously produced a zero-timestamp XID silently.
- **Machine ID is now hashed** — `machineId` exposes hashed bytes (hex) instead of the raw system identifier.
- **Removed `Result<T, E>` usage** — Simplified error handling across the API.
- **Removed `HashFunction` from feature registry** — Hash function is now injected directly into `XIDGenerator`.

### Bug fixes

- **Full 24-bit random counter seed** — Was previously truncated.
- **Counter reset on timestamp change** — Counter was not resetting when the second boundary changed.
- **Last timestamp of 0 no longer resets counter seed** incorrectly.
- **MurmurHash3 corrected** to canonical x86_32 implementation (web).
- **`fromString` regex validation** — Added `^$` anchors to prevent partial matches.
- **Unsigned timestamp extraction** — Added `>>> 0` for post-2038 dates.
- **`toJSON()` added** — Enables correct `JSON.stringify` behavior.

### New features

- **`xid.compare()`** — Compare method directly on XID instances.
- **Web machine ID persistence** — Uses `localStorage` for stable machine IDs across sessions.
- **`degraded` flag** — Indicates when running with degraded security (plain boolean, immutable after construction).
- **`allowInsecure` / critical flag gating** — Security controls restored.
- **cuid2 added to benchmarks**.

### Internal

- Sync `FeatureSet` signatures, `Environment.get()`, and all feature implementations.
- `readFileSync`/`execFileSync` in `os-hostid.ts` (500ms timeout).
- Inline SHA-256 hash in node/deno, MurmurHash3 in web.
- `FeatureCandidate` type for nullable adapter returns.
- Type predicates replace `FeatureValidator`.
- `satisfies` for adapter configs, removed wrapper indirection.
- Deleted: `hash-function/`, `utils.ts`, `deno-hostid.ts`, `container-cpuset.ts`.
