/**
 * XID Benchmark
 *
 * Compares XID with other popular ID generation libraries.
 */

const { Bench } = require('tinybench');
const crypto = require('crypto');
const { v1: uuidv1, v4: uuidv4, v7: uuidv7 } = require('uuid');
const { ulid } = require('ulid');
const KSUID = require('ksuid');
const { nanoid } = require('nanoid');
const hyperid = require('hyperid');

// Import our NeXID implementation (from the compiled JS)
const NeXID = require('../bin/nexid-node.js');

// Constants
const NUM_IDS = 1_000_000; // 1 million IDs for reporting

// Create hyperid instance (it's a factory function)
const hyperidInstance = hyperid();

// Sample ID storage
const sampleIds = {};

// Run the benchmark
async function runBenchmark() {
  const neXIDGenerator = await NeXID.init();

  // ID generators
  const generators = {
    'NeXID.newId()': () => neXIDGenerator.newId().toString(),
    'NeXID.fastId()': () => neXIDGenerator.fastId(),
    'uuid v1': () => uuidv1(),
    'uuid v4': () => uuidv4(),
    'uuid v7': () => uuidv7(),
    'node randomUUID': () => crypto.randomUUID(),
    ulid: () => ulid(),
    nanoid: () => nanoid(),
    hyperid: () => hyperidInstance(),
  };

  // Add KSUID (it's async)
  async function ksuidGenerator() {
    return (await KSUID.random()).string;
  }

  // Create the benchmark
  const bench = new Bench({ time: 1000 });

  // Add tasks
  Object.entries(generators).forEach(([name, generator]) => {
    bench.add(`Generate ${NUM_IDS} ${name}`, () => {
      for (let i = 0; i < 1000; i++) {
        const id = generator();
        if (i === 0 && !sampleIds[name]) {
          sampleIds[name] = id;
        }
      }
    });
  });

  // Add KSUID separately (it's async)
  bench.add(`Generate ${NUM_IDS} ksuid`, async () => {
    for (let i = 0; i < 100; i++) {
      const id = await ksuidGenerator();
      if (i === 0 && !sampleIds['ksuid']) {
        sampleIds['ksuid'] = id;
      }
    }
  });

  // Run the benchmark
  console.log('=== ID Generation Benchmark ===');
  console.log(`Benchmarking ${NUM_IDS.toLocaleString()} IDs with each library...`);
  await bench.run();

  // Sort by operations per second (higher is better)
  const results = [];

  bench.tasks.forEach((task) => {
    const name = task.name.replace(`Generate ${NUM_IDS} `, '');
    // Calculate accurate ops/sec based on number of iterations in the loop
    const multiplier = name === 'ksuid' ? 100 : 1000;
    const opsPerSec = (task.result.hz * multiplier) | 0;
    const timePerOp = 1_000_000_000 / opsPerSec;

    results.push({
      name,
      opsPerSec,
      timePerOp,
    });
  });

  // Sort by speed
  results.sort((a, b) => b.opsPerSec - a.opsPerSec);

  // Print results
  console.log('\n=== Results ===');
  console.log('\nGeneration Speed (ops/sec, higher is better):');
  ('------------------------------------------------------------------------------');
  results.forEach((result) => {
    const idsPerSec = result.opsPerSec.toLocaleString().padStart(12);
    const nsPerId = Math.trunc(result.timePerOp);
    console.log(`${result.name.padEnd(20)}: ${idsPerSec} ids/sec (${nsPerId}ns per id)`);
  });

  console.log('\nSample IDs and Length:');
  ('------------------------------------------------------------------------------');
  Object.entries(sampleIds)
    .map(([name, id]) => [name, id, getByteLength(id)])
    .sort((a, b) => a[2] - b[2])
    .forEach(([name, id, byteLength]) => {
      console.log(`${name.padEnd(20)}: ${id} (${id.length} chars, ${byteLength} bytes)`);
    });
}

// Helper function to get approximate byte length
function getByteLength(str) {
  return Buffer.from(str).length;
}

// Run the benchmark
runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
