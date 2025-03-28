import * as esbuild from 'esbuild';

const sharedOptions = {
  bundle: true,
  logLevel: 'info',
  color: true,
};

function minify(options) {
  return {
    ...options,
    minify: true,
    outfile: options.outfile.replace('.js', '.min.js'),
  };
}

// ================================
// Default
// ================================

const defaultBuild = {
  ...sharedOptions,
  entryPoints: ['./src/index.ts'],
  platform: 'node',
  outfile: './bin/nexid.js',
};
await esbuild.build(defaultBuild);
await esbuild.build(minify(defaultBuild));

// ================================
// Node
// ================================

const nodeBuild = {
  ...sharedOptions,
  entryPoints: ['./src/index-node.ts'],
  platform: 'node',
  outfile: './bin/nexid-node.js',
};
await esbuild.build(nodeBuild);
await esbuild.build(minify(nodeBuild));

// ================================
// Web
// ================================

const webBuild = {
  ...sharedOptions,
  entryPoints: ['./src/index-web.ts'],
  platform: 'browser',
  outfile: './bin/nexid-web.js',
  globalName: 'NeXID',
  sourcemap: true,
};
await esbuild.build(webBuild);
await esbuild.build(minify(webBuild));
