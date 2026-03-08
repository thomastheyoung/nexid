import { parseArgs } from 'node:util';

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
import { measureAsync, measureSync } from './measure.js';

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

  for (let i = 0; i < generators.length; i++) {
    const gen = generators[i]!;

    if (!json) {
      printTaskStart(gen.name, i, total);
    }

    const sampleId = String(gen.async ? await gen.fn() : gen.fn());

    const { stats, opsPerSec } = gen.async
      ? await measureAsync(gen.fn)
      : measureSync(gen.fn);

    const result: BenchmarkResult = {
      name: gen.name,
      opsPerSec,
      nsPerOp: Math.round(stats.mean),
      p99ns: Math.round(stats.p99),
      rme: stats.rme,
      samples: stats.sampleCount,
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
