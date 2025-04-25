import * as esbuild from 'esbuild';
import fs from 'fs';

var packageJSON = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const additionalPackages = ['fsevents'];
const packagesBlacklist = ['chokidar'];
const externalPackages = [
  ...Object.keys(packageJSON.dependencies),
  ...Object.keys(packageJSON.peerDependencies),
  ...additionalPackages,
].filter((dep) => !packagesBlacklist.includes(dep));

const watchMode = process.argv.includes('--watch');
const productionBuild = process.env.NODE_ENV === 'production';
const PRODUCTION_CONFIG = {
  treeShaking: true,
  splitting: true,
  minify: true,
};
const COMMON_CONFIG = {
  bundle: true,
  platform: 'node',
  logLevel: 'info',
  ...(productionBuild ? PRODUCTION_CONFIG : {}),
};
const build = watchMode ? esbuild.context : esbuild.build;

function getMarkCommonAsExternal(pathToCommon) {
  return {
    name: 'markCommonAsExternal',
    setup(build) {
      build.onResolve({ filter: /^\..*\/common.*$/ }, (args) => {
        return {
          path: pathToCommon,
          namespace: 'file',
          external: true,
        };
      });
    },
  };
}

/*    ESModules    */

const ESMODULE_CONFIG = {
  ...COMMON_CONFIG,
  format: 'esm',
  outExtension: {
    '.js': '.mjs',
  },
};

let commonOutputFile = (
  await esbuild.build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/common/index.ts'],
    outdir: 'build/common',
    packages: 'external',
    write: false,
  })
).outputFiles[0].path;

const esmoduleBuildPromises = [
  //common
  build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/common/index.ts'],
    outdir: 'build/common',
    packages: 'external',
  }),
  //server
  //client
  build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/client/index.ts'],
    outdir: 'build/client',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
    packages: 'external',
    splitting: true,
  }),
];

/*    CommonJS    */

const COMMONJS_CONFIG = {
  ...COMMON_CONFIG,
  outExtension: {
    '.js': '.cjs',
  },
  packages: 'external',
  splitting: false,
};

//common output file
commonOutputFile = (
  await esbuild.build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/common/index.ts'],
    outdir: 'build/common',
    write: false,
  })
).outputFiles[0].path;

const commonBuildPromises = [
  //common
  build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/common/index.ts'],
    outdir: 'build/common',
  }),
  //server
  //client
  build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/client/index.ts'],
    outdir: 'build/client',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
  }),
];

await Promise.all([...commonBuildPromises, ...esmoduleBuildPromises]);

if (watchMode) {
  const watchPromises = [...commonBuildPromises, ...esmoduleBuildPromises].map(async (prom) => (await prom).watch());
  await Promise.all(watchPromises);
}
