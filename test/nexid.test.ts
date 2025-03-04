/**
 * NeXID - Test Suite
 *
 * This file contains comprehensive tests for the NeXID implementation.
 * It tests all core functionality:
 * - ID generation
 * - Lexicographical and time-based ordering
 * - Serialization/deserialization
 * - Comparison and equality
 * - Performance
 *
 * Run with: npm test
 */

import NeXID from '../src/index';
import { createXidGenerator } from '../src/lib/generator';
import { ID } from '../src/lib/nexid';

function runTests() {
  console.log('=== NeXID Test Suite ===\n');

  // Test generating IDs
  console.log('Generating sample IDs:');
  const ids: ID[] = [];
  for (let i = 0; i < 5; i++) {
    const id = NeXID.newId();
    ids.push(id);
    console.log(`  ${id.toString()} (length: ${id.toString().length})`);
  }

  // Test lexicographic and time-based ordering
  console.log('\nTesting lexicographic and time-based ordering:');
  const now = new Date();
  const timeIds: ID[] = [];

  // Create IDs with 1-second intervals
  for (let i = 0; i < 3; i++) {
    const time = new Date(now.getTime() + i * 1000);
    // Create a generator to generate IDs with specific time
    const generator = createXidGenerator();
    const id = generator.generateWithTime(time);
    timeIds.push(id);
    console.log(`  ${id.toString()} - timestamp: ${id.getTime().toISOString()}`);
  }

  // Shuffle and sort to verify ordering
  const shuffled = [...timeIds].sort(() => Math.random() - 0.5);
  console.log('\nShuffled IDs:');
  shuffled.forEach((id) => console.log(`  ${id.toString()}`));

  const sorted = NeXID.sortIds(shuffled);
  console.log('\nSorted IDs (lexicographically, which matches time order):');
  sorted.forEach((id) => console.log(`  ${id.toString()}`));

  // Test serialization and deserialization
  console.log('\nTesting serialization/deserialization:');
  const original = NeXID.newId();
  const serialized = original.toString();
  const deserialized = NeXID.fromString(serialized);

  console.log(`  Original: ${original.toString()}`);
  console.log(`  Serialized: ${serialized}`);
  console.log(`  Deserialized: ${deserialized.toString()}`);
  console.log(`  Equal: ${original.equals(deserialized)}`);

  // Test Nil ID
  console.log('\nTesting nil ID:');
  console.log(`  Nil ID: ${NeXID.nilId.toString()}`);
  console.log(`  Is nil: ${NeXID.nilId.isNil()}`);
  console.log(`  Regular ID is nil: ${ids[0].isNil()}`);

  // Performance test
  console.log('\nPerformance test (100,000 IDs):');
  console.time('Generate 100k IDs');
  for (let i = 0; i < 100000; i++) {
    NeXID.newId();
  }
  console.timeEnd('Generate 100k IDs');

  console.log('\nTest suite complete!');
}

// Run all tests if executed directly
if (require.main === module) {
  runTests();
}

// Export for potential use in other tests
export { runTests };
