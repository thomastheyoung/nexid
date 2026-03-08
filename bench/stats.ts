export interface Stats {
  /** Arithmetic mean in nanoseconds. */
  mean: number;
  /** 99th percentile in nanoseconds. */
  p99: number;
  /** Relative margin of error as a percentage. */
  rme: number;
  /** Number of samples collected. */
  sampleCount: number;
}

export function computeStats(samples: Float64Array): Stats {
  const n = samples.length;
  if (n < 2) {
    throw new RangeError(`Need at least 2 samples, got ${n}`);
  }

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += samples[i]!;
  }
  const mean = sum / n;

  let sumSqDiff = 0;
  for (let i = 0; i < n; i++) {
    const diff = samples[i]! - mean;
    sumSqDiff += diff * diff;
  }
  const stddev = Math.sqrt(sumSqDiff / (n - 1));

  const sem = stddev / Math.sqrt(n);
  const rme = mean === 0 ? Infinity : ((1.96 * sem) / Math.abs(mean)) * 100;

  const sorted = Float64Array.from(samples).sort();
  const p99 = sorted[Math.ceil(n * 0.99) - 1]!;

  return { mean, p99, rme, sampleCount: n };
}
