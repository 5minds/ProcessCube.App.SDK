const fs = require('node:fs');
const postcss = require('postcss');
const esbuild = require('esbuild');
const postCssPlugin = require('esbuild-style-plugin');
const inlineImportPlugin = require('esbuild-plugin-inline-import');

const BASE_DIRECTORY = 'src';
const formats = {
  esm: '.mjs',
  cjs: '.cjs',
};

// const entryPoints = fs
//   .readdirSync(BASE_DIRECTORY, { recursive: true })
//   .filter((path) => path.endsWith('.css'))
//   .map((path) => `src/${path}`);

/** @type {import('esbuild').BuildOptions} */
const BUILD_OPTIONS = {
  entryPoints: ['src/client/index.ts', 'src/common/index.ts', 'src/server/index.ts'],
  outdir: '.',
  bundle: true,
  minify: process.env.NODE_ENV !== 'production' ? false : true,
  entryNames: '[dir]/[name]',
  outbase: BASE_DIRECTORY,
  packages: 'external',
  logLevel: 'verbose',
  plugins: [
    // postCssPlugin({
    //   extract: true,
    //   postcss: {
    //     plugins: [require('tailwindcss'), require('autoprefixer')],
    //   },
    // }),
    inlineImportPlugin({
      transform: async (content, args) => {
        console.log('content', content);
        console.log('args', args);
        const result = await postcss([require('tailwindcss'), require('autoprefixer')]).process(content, {
          from: args.path,
        });

        console.log('result', result);
        return result.css;
      },
    }),
  ],
};

// console.log(`Build CSS for ${entryPoints.join(' and\n\t')}`);

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
  Object.keys(formats).forEach((key) => {
    const extension = formats[key];
    esbuild.build({ ...BUILD_OPTIONS, outExtension: { '.js': extension }, format: key }).catch(() => {
      console.error(`Build error: ${error}`);
      process.exit(1);
    });
  });
}
