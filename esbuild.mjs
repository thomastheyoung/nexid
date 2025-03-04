import * as esbuild from 'esbuild';

const sharedOptions = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  logLevel: 'info',
  color: true,
};

// Non-minified bundle
await esbuild.build({
  ...sharedOptions,
  platform: 'browser',
  outfile: './bin/nexid.js',
});

// Minified bundle
await esbuild.build({
  ...sharedOptions,
  platform: 'browser',
  outfile: './bin/nexid-min.js',
  minify: true,
  sourcemap: true,
});
