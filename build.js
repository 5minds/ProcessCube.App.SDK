import * as esbuild from 'esbuild'

/*    ESModules    */

//common
await esbuild.build({
  entryPoints: ['src/common/index.ts'],
  bundle: true,
  outdir: 'build/common',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.mjs',
  },
  format: 'esm',
});
const moduleBuildResult = await esbuild.build({
  entryPoints: ['src/common/index.ts'],
  bundle: true,
  outdir: 'build/common',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.mjs',
  },
  format: 'esm',
  write: false,
});
let myPlug = {
  name: 'plug',
  setup(build) {
    build.onResolve({ filter: /^\..*\/common.*$/ }, args => {
      return {
        path: moduleBuildResult.outputFiles[0].path,
        namespace: 'file',
        external: true,
    }})
  },
}

//server
await esbuild.build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  outdir: 'build/server',
  platform: 'node',
  outExtension: {
    '.js': '.mjs',
  },
  format: 'esm',
  plugins: [myPlug],
  external: [
    "@opentelemetry", "fsevents", "@5minds/*", "next", "next-auth", "react", "jwt-decode", "openid-client", "esbuild"
  ],
});

//client
await esbuild.build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  outdir: 'build/client',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.mjs',
  },
  format: 'esm',
  plugins: [myPlug],
});


/*    CommonJS    */

//common
const commonBuildResult = await esbuild.build({
  entryPoints: ['src/common/index.ts'],
  bundle: true,
  outbase: 'src',
  outdir: 'build',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.cjs',
  },
  write: false,
});
await esbuild.build({
  entryPoints: ['src/common/index.ts'],
  bundle: true,
  outbase: 'src',
  outdir: 'build',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.cjs',
  },
});

myPlug = {
  name: 'plug',
  setup(build) {
    build.onResolve({ filter: /^\..*\/common.*$/ }, args => {
      return {
        path: commonBuildResult.outputFiles[0].path,
        namespace: 'file',
        external: true,
    }})
  },
}

//server
await esbuild.build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  outdir: 'build/server',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.cjs',
  },
  plugins: [myPlug],
});

//client
await esbuild.build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  outdir: 'build/client',
  packages: 'external',
  platform: 'node',
  outExtension: {
    '.js': '.cjs',
  },
  plugins: [myPlug],
});
