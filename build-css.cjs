const fs = require('node:fs');

const esbuild = require('esbuild');
const postCssPlugin = require('esbuild-style-plugin');

const BASE_DIRECTORY = 'src';

const entryPoints = fs
  .readdirSync(BASE_DIRECTORY, { recursive: true })
  .filter((path) => path.endsWith('.css'))
  .map((path) => `src/${path}`);

const BUILD_OPTIONS = {
  entryPoints: entryPoints,
  outdir: 'build',
  bundle: true,
  minify: process.env.NODE_ENV !== 'production' ? false : true,
  entryNames: '[dir]/[name]',
  outbase: BASE_DIRECTORY,
  packages: 'external',
  outExtension: { '.js': '.EMPTY' },
  plugins: [
    postCssPlugin({
      extract: true,
      postcss: {
        plugins: [require('tailwindcss'), require('autoprefixer')],
      },
    }),
  ],
};

console.log(`Build CSS for ${entryPoints.join(' and\n\t')}`);

const args = process.argv.slice(2);
if (args.includes('--watch')) {
  esbuild
    .context(BUILD_OPTIONS)
    .then((ctx) => {
      ctx
        .watch()
        .then(() => {
          console.log('watching for css file changes...');
        })
        .catch((reason) => {
          console.error(`Watch failed: ${reason}`);
          process.exit(1);
        });
    })
    .catch(() => {
      console.error(`Build error: ${error}`);
      process.exit(1);
    });
} else {
  esbuild.build(BUILD_OPTIONS).catch(() => {
    console.error(`Build error: ${error}`);
    process.exit(1);
  });
}
