import { parseArgs } from 'node:util';

import { Bench } from 'tinybench';

import {
  printHeader,
  printJson,
  printReport,
  printTaskComplete,
  printTaskStart,
  type BenchmarkReport,
  type BenchmarkResult,
} from './format.js';
import { createGenerators, type GeneratorEntry } from './generators.js';

const { values: flags } = parseArgs({
  options: {
    json: { type: 'boolean', default: false },
  },
});

async function run() {
  const generators = createGenerators();
  const json = flags.json ?? false;

  if (!json) {
    printHeader(process.version);
  }

  const results = await runBenchmarks(generators, json);
  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    results,
  };

  if (json) {
    printJson(report);
  } else {
    printReport(report);
  }
}

async function runBenchmarks(
  generators: GeneratorEntry[],
  json: boolean,
): Promise<BenchmarkResult[]> {
  const total = generators.length;
  const results: BenchmarkResult[] = [];

  // Run each generator as its own Bench instance so we get per-task progress.
  // tinybench's bench.run() executes all tasks sequentially with no per-task
  // callback between them, so running individually is the cleanest way to get
  // real-time feedback.
  for (let i = 0; i < generators.length; i++) {
    const gen = generators[i]!;

    if (!json) {
      printTaskStart(gen.name, i, total);
    }

    // Capture a sample ID before benchmarking to keep the hot path clean
    const sampleId = String(await gen.fn());

    const bench = new Bench({ time: 1000, warmup: true, warmupTime: 250 });

    bench.add(gen.name, gen.fn);

    await bench.run();

    const task = bench.tasks[0]!;
    const r = task.result;

    if (r.state !== 'completed') {
      process.stderr.write(`  \u2717 ${gen.name} failed (${r.state})\n`);
      continue;
    }

    const result: BenchmarkResult = {
      name: gen.name,
      // throughput.mean is the arithmetic mean of per-sample throughput values,
      // which differs from 1/latency.mean due to Jensen's inequality. This is
      // the more conservative (slightly lower) number.
      opsPerSec: Math.round(r.throughput.mean),
      nsPerOp: Math.round(r.latency.mean * 1_000_000),
      p99ns: Math.round(r.latency.p99 * 1_000_000),
      rme: r.latency.rme,
      samples: r.latency.samplesCount,
      unstable: r.latency.rme > 5,
      sampleId,
      byteLength: Buffer.byteLength(sampleId, 'utf8'),
    };

    results.push(result);

    if (!json) {
      printTaskComplete(result, i, total);
    }
  }

  return results;
}

run().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exitCode = 1;
});
