export const PERF_TEST_COUNT = 1_000_000;

export function runPerformanceTest(fn: Function, size: number = PERF_TEST_COUNT) {
  const start = performance.now();
  const ids: string[] = [];
  for (let index = 0; index < size; index++) {
    ids.push(fn());
  }
  const end = performance.now();
  const idsPerSecond = Math.round(size / ((end - start) / 1000));

  const formatted = {
    size: size.toLocaleString(),
    time: (end - start).toFixed(1),
    idsPerSecond: idsPerSecond.toLocaleString()
  };

  return {
    time: end - start,
    idsPerSecond,
    sampleIds: ids.slice(-3),
    toString: () =>
      `Generated ${formatted.size} ids in ${formatted.time}ms (ids/second: ${formatted.idsPerSecond})`
  };
}
