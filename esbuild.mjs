import * as esbuild from 'esbuild';

const sharedOptions = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  logLevel: 'info',
  color: true,
};

// ================================
// Node (import)
// ================================

// Non-minified bundle
await esbuild.build({
  ...sharedOptions,
  platform: 'node',
  outfile: './bin/nexid.js',
});

// Minified bundle
await esbuild.build({
  ...sharedOptions,
  platform: 'node',
  outfile: './bin/nexid-min.js',
  minify: true,
  sourcemap: true,
});

// ================================
// CJS (require)
// ================================

// Non-minified bundle
await esbuild.build({
  ...sharedOptions,
  platform: 'browser',
  outfile: './bin/nexid-web.js',
});

// Minified bundle
await esbuild.build({
  ...sharedOptions,
  platform: 'browser',
  outfile: './bin/nexid-web-min.js',
  minify: true,
  sourcemap: true,
});
