import { styleText } from 'node:util';

export interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  nsPerOp: number;
  p99ns: number;
  rme: number;
  samples: number;
  unstable: boolean;
  sampleId: string;
  byteLength: number;
}

export interface BenchmarkReport {
  timestamp: string;
  nodeVersion: string;
  results: BenchmarkResult[];
}

const BAR_WIDTH = 30;
const NAME_WIDTH = 20;

function isNexid(name: string): boolean {
  return name.startsWith('NeXID');
}

function styleName(name: string): string {
  // Pad first, then style — ANSI codes break padEnd length calculation
  const padded = name.padEnd(NAME_WIDTH);
  return isNexid(name) ? styleText('bold', styleText('green', padded)) : padded;
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtNs(ns: number): string {
  if (ns >= 1_000_000) return `${(ns / 1_000_000).toFixed(1)}ms`;
  if (ns >= 1_000) return `${(ns / 1_000).toFixed(1)}\u00b5s`;
  return `${Math.round(ns)}ns`;
}

function bar(value: number, max: number, nexid: boolean): string {
  const filled = Math.round((value / max) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const filledStr = '\u2588'.repeat(filled);
  const emptyStr = '\u2591'.repeat(empty);
  const barStr = filledStr + emptyStr;
  return nexid ? styleText('green', barStr) : styleText('gray', barStr);
}

// -- Progress output (written to stderr so --json stdout stays clean) --

export function printHeader(nodeVersion: string): void {
  const date = new Date().toISOString().slice(0, 10);
  process.stderr.write(
    `\n  ${styleText('bold', 'nexid benchmark')} ${styleText('gray', `\u00b7 node ${nodeVersion} \u00b7 ${date}`)}\n\n`,
  );
}

export function printTaskStart(name: string, index: number, total: number): void {
  const counter = styleText('gray', `(${index + 1}/${total})`);
  process.stderr.write(`  Running ${styleText('cyan', name)}... ${counter}\r`);
}

export function printTaskComplete(result: BenchmarkResult, index: number, total: number): void {
  const check = styleText('green', '\u2713');
  const name = styleName(result.name);
  const ops = fmtNum(result.opsPerSec);
  const rme = `\u00b1${result.rme.toFixed(1)}%`;
  const warn = result.unstable ? ` ${styleText('yellow', '\u26a0')}` : '';
  const counter = styleText('gray', `(${index + 1}/${total})`);

  process.stderr.write(`\x1b[2K  ${check} ${name} ${ops.padStart(14)} ops/sec  ${rme.padStart(7)}${warn}  ${counter}\n`);
}

// -- Final report (written to stdout) --

export function printReport(report: BenchmarkReport): void {
  const { results } = report;
  if (results.length === 0) return;

  const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
  const maxOps = sorted[0].opsPerSec;

  // Results table
  console.log(`\n  ${styleText('gray', '\u2500\u2500')} ${styleText('bold', 'Results')} ${styleText('gray', '\u2500'.repeat(62))}\n`);

  const header = `  ${'#'.padStart(2)}  ${'Name'.padEnd(NAME_WIDTH)}  ${'ops/sec'.padStart(14)}  ${'p99'.padStart(8)}  ${'vs best'.padStart(8)}  `;
  console.log(styleText('gray', header));
  console.log(styleText('gray', '  ' + '\u2500'.repeat(72)));

  sorted.forEach((r, i) => {
    const rank = String(i + 1).padStart(2);
    const name = styleName(r.name);
    const ops = fmtNum(r.opsPerSec).padStart(14);
    const p99 = fmtNs(r.p99ns).padStart(8);
    const ratio = i === 0
      ? 'best'.padStart(8)
      : `${(r.opsPerSec / maxOps).toFixed(2)}x`.padStart(8);
    const barStr = bar(r.opsPerSec, maxOps, isNexid(r.name));
    const warn = r.unstable
      ? `  ${styleText('yellow', `\u26a0 \u00b1${r.rme.toFixed(1)}%`)}`
      : '';

    console.log(`  ${rank}  ${name}  ${ops}  ${p99}  ${ratio}  ${barStr}${warn}`);
  });

  // Sample IDs
  console.log(`\n  ${styleText('gray', '\u2500\u2500')} ${styleText('bold', 'Sample IDs')} ${styleText('gray', '\u2500'.repeat(59))}\n`);

  const bySizeAndName = [...results].sort(
    (a, b) => a.byteLength - b.byteLength || a.name.localeCompare(b.name),
  );

  for (const r of bySizeAndName) {
    const name = styleName(r.name);
    const id = styleText('gray', r.sampleId);
    console.log(`  ${name}  ${id}  ${String(r.sampleId.length).padStart(2)} chars  ${String(r.byteLength).padStart(2)} bytes`);
  }

  // Summary — compare NeXID.fastId() to the most common alternative (uuid v4)
  const nexidFast = results.find((r) => r.name === 'NeXID.fastId()');
  const uuidV4 = results.find((r) => r.name === 'uuid v4');
  if (nexidFast && uuidV4) {
    const ratio = (nexidFast.opsPerSec / uuidV4.opsPerSec).toFixed(1);
    console.log(
      `\n  ${styleText('green', `NeXID.fastId() is ${ratio}x faster than uuid v4`)}\n`,
    );
  }
}

export function printJson(report: BenchmarkReport): void {
  console.log(JSON.stringify(report, null, 2));
}
