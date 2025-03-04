import * as esbuild from 'esbuild';

const sharedOptions = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  logLevel: 'info',
  color: true,
};

// Node build
await esbuild.build({
  ...sharedOptions,
  platform: 'node',
  outfile: './dist/bundle-node.js',
});

// Web/Browser build
await esbuild.build({
  ...sharedOptions,
  platform: 'browser',
  outfile: './dist/bundle-web.js',
  minify: true,
  sourcemap: true,
});
