import * as esbuild from 'esbuild'

const productionBuild = process.env.NODE_ENV === 'production';

function getPlugin(pathToCommon) {
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

/*    ESModules    */

const ESMODULE_CONFIG = {
  ...COMMON_CONFIG,
  format: 'esm',
  outExtension: {
    '.js': '.mjs',
  },
};

//common
const moduleBuildResult = await esbuild.build({
  ...ESMODULE_CONFIG,
  entryPoints: ['src/common/index.ts'],
  outdir: 'build/common',
  packages: 'external',
  write: false,
});
await esbuild.build({
  ...ESMODULE_CONFIG,
  entryPoints: ['src/common/index.ts'],
  outdir: 'build/common',
  packages: 'external',
});

//server
await esbuild.build({
  ...ESMODULE_CONFIG,
  entryPoints: ['src/server/index.ts'],
  outdir: 'build/server',
  plugins: [getPlugin(moduleBuildResult.outputFiles[0].path)],
  external: [
    "@opentelemetry", "fsevents", "@5minds/*", "next", "next-auth", "react", "jwt-decode", "openid-client", "esbuild"
  ],
});

//client
await esbuild.build({
  ...ESMODULE_CONFIG,
  entryPoints: ['src/client/index.ts'],
  outdir: 'build/client',
  plugins: [getPlugin(moduleBuildResult.outputFiles[0].path)],
  packages: 'external',
});


/*    CommonJS    */

const COMMONJS_CONFIG = {
  ...COMMON_CONFIG,
  outExtension: {
    '.js': '.cjs',
  },
  packages: 'external',
  splitting: false,
};

//common
const commonBuildResult = await esbuild.build({
  ...COMMONJS_CONFIG,
  entryPoints: ['src/common/index.ts'],
  outdir: 'build/common',
  write: false,
});
await esbuild.build({
  ...COMMONJS_CONFIG,
  entryPoints: ['src/common/index.ts'],
  outdir: 'build/common',
});

//server
await esbuild.build({
  ...COMMONJS_CONFIG,
  entryPoints: ['src/server/index.ts'],
  outdir: 'build/server',
  plugins: [getPlugin(commonBuildResult.outputFiles[0].path)],
});

//client
await esbuild.build({
  ...COMMONJS_CONFIG,
  entryPoints: ['src/client/index.ts'],
  outdir: 'build/client',
  plugins: [getPlugin(commonBuildResult.outputFiles[0].path)],
});
