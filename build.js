import * as esbuild from 'esbuild'

const productionBuild = process.env.NODE_ENV === 'production';
const PRODUCTION_CONFIG = {
  treeShaking: true,
  splitting: true,
  minify: true,
  drop: ['console'],
};
const COMMON_CONFIG = {
  bundle: true,
  platform: 'node',
  ...(productionBuild ? PRODUCTION_CONFIG : {})
};

function getMarkCommonAsExternal(pathToCommon) {
  return {
    name: 'markCommonAsExternal',
    setup(build) {
      build.onResolve({ filter: /^\..*\/common.*$/ }, args => {
        return {
          path: pathToCommon,
          namespace: 'file',
          external: true,
      }})
    },
  }
}

/*    ESModules    */

const ESMODULE_CONFIG = {
  ...COMMON_CONFIG,
  format: 'esm',
  outExtension: {
    '.js': '.mjs',
  },
};

let commonOutputFile = (await esbuild.build({
  ...ESMODULE_CONFIG,
  entryPoints: ['src/common/index.ts'],
  outdir: 'build/common',
  packages: 'external',
  write: false,
})).outputFiles[0].path;

const esmoduleBuildPromises = [
  //common
  esbuild.build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/common/index.ts'],
    outdir: 'build/common',
    packages: 'external',
  }),
  //server
  esbuild.build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/server/index.ts'],
    outdir: 'build/server',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
    external: [
      "@opentelemetry", "fsevents", "@5minds/*", "next", "next-auth", "react", "jwt-decode", "openid-client", "esbuild"
    ],
  }),
  //client
  esbuild.build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/client/index.ts'],
    outdir: 'build/client',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
    packages: 'external',
  })
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
commonOutputFile = (await esbuild.build({
  ...COMMONJS_CONFIG,
  entryPoints: ['src/common/index.ts'],
  outdir: 'build/common',
  write: false,
})).outputFiles[0].path;

const commonBuildPromises = [
  //common
  esbuild.build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/common/index.ts'],
    outdir: 'build/common',
  }),
  //server
  esbuild.build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/server/index.ts'],
    outdir: 'build/server',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
  }),
  //client
  esbuild.build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/client/index.ts'],
    outdir: 'build/client',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
  })
];

await Promise.all([...commonBuildPromises, ...esmoduleBuildPromises]);
