import { computeStats, type Stats } from './stats.js';

export interface MeasureOptions {
  /** Measurement duration in milliseconds. Default: 1000. */
  time?: number;
  /** Warmup duration in milliseconds. Default: 250. */
  warmupTime?: number;
}

export interface MeasureResult {
  stats: Stats;
  opsPerSec: number;
}

const defaults = {
  time: 1000,
  warmupTime: 250,
} satisfies Required<MeasureOptions>;

let sink: unknown;

/**
 * Warmup the function and auto-calibrate a batch size where each
 * sample takes roughly 1ms (long enough for hrtime to measure accurately).
 */
function calibrate(fn: () => unknown, warmupMs: number): number {
  let batchSize = 1;
  const warmupEnd = process.hrtime.bigint() + BigInt(warmupMs) * 1_000_000n;

  while (process.hrtime.bigint() < warmupEnd) {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < batchSize; i++) {
      sink = fn();
    }
    const elapsedMs = Number(process.hrtime.bigint() - t0) / 1_000_000;

    if (elapsedMs < 1) {
      batchSize *= 2;
    }
  }

  return batchSize;
}

export function measureSync(
  fn: () => unknown,
  options?: MeasureOptions,
): MeasureResult {
  const { time, warmupTime } = { ...defaults, ...options };

  const batchSize = calibrate(fn, warmupTime);

  const samples: number[] = [];
  const deadline = process.hrtime.bigint() + BigInt(time) * 1_000_000n;

  while (process.hrtime.bigint() < deadline) {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < batchSize; i++) {
      sink = fn();
    }
    const elapsedNs = Number(process.hrtime.bigint() - t0) / batchSize;
    samples.push(elapsedNs);
  }

  // Prevent dead code elimination
  if (typeof sink === 'symbol') throw new Error('unreachable');

  const stats = computeStats(Float64Array.from(samples));
  return {
    stats,
    opsPerSec: Math.round(1_000_000_000 / stats.mean),
  };
}

export async function measureAsync(
  fn: () => Promise<unknown>,
  options?: MeasureOptions,
): Promise<MeasureResult> {
  const { time, warmupTime } = { ...defaults, ...options };

  // Warmup (no batching — async overhead dwarfs timer cost)
  const warmupEnd = process.hrtime.bigint() + BigInt(warmupTime) * 1_000_000n;
  while (process.hrtime.bigint() < warmupEnd) {
    await fn();
  }

  const samples: number[] = [];
  const deadline = process.hrtime.bigint() + BigInt(time) * 1_000_000n;

  while (process.hrtime.bigint() < deadline) {
    const t0 = process.hrtime.bigint();
    await fn();
    const elapsedNs = Number(process.hrtime.bigint() - t0);
    samples.push(elapsedNs);
  }

  const stats = computeStats(Float64Array.from(samples));
  return {
    stats,
    opsPerSec: Math.round(1_000_000_000 / stats.mean),
  };
}
