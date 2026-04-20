import * as esbuild from 'esbuild';
import fs from 'fs';

var packageJSON = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const additionalPackages = ['fsevents'];
const packagesBlacklist = ['chokidar'];
const bundlePackages = ['bpmn-js', 'diagram-js', 'diagram-js-direct-editing', 'bpmn-moddle'];
const externalPackages = [...Object.keys(packageJSON.dependencies), ...Object.keys(packageJSON.peerDependencies), ...additionalPackages].filter(
  (dep) => !packagesBlacklist.includes(dep) && !bundlePackages.includes(dep),
);

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

/**
 * Appends `.js` to bare external imports (e.g. `next/headers` → `next/headers.js`)
 * so that Node's strict ESM resolver can find them even when the target package
 * does not ship an `exports` map.
 *
 * Only rewrites specifiers that look like `<pkg>/<subpath>` without an existing
 * extension and that are already marked external by esbuild.
 */
const addJsExtensionToExternals = {
  name: 'addJsExtensionToExternals',
  setup(build) {
    // Match bare subpath imports of external packages (e.g. "next/headers", "next/navigation")
    // but skip paths that already have a file extension.
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      const parts = args.path.split('/');

      // Skip packages that should be bundled (e.g. bpmn-js, diagram-js)
      const pkgName = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      if (bundlePackages.includes(pkgName)) return null;

      // Only target subpath imports (e.g. "next/headers"), not bare package names (e.g. "next")
      const isScopedSubpath = parts[0].startsWith('@') && parts.length > 2;
      const isPlainSubpath = !parts[0].startsWith('@') && parts.length > 1;
      if (!isScopedSubpath && !isPlainSubpath) return null;

      // Skip if the last segment already has an extension
      const lastSegment = parts[parts.length - 1];
      if (lastSegment.includes('.')) return null;

      return {
        path: args.path + '.js',
        external: true,
      };
    });
  },
};

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
  build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/server/index.ts'],
    outdir: 'build/server',
    plugins: [getMarkCommonAsExternal(commonOutputFile), addJsExtensionToExternals],
    external: externalPackages,
  }),
  //client
  build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/client/index.ts'],
    outdir: 'build/client',
    plugins: [getMarkCommonAsExternal(commonOutputFile), addJsExtensionToExternals],
    external: externalPackages,
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
  build({
    ...COMMONJS_CONFIG,
    entryPoints: ['src/server/index.ts', 'src/server/lib/ExternalTaskWorkerProcess.ts'],
    outdir: 'build/server',
    plugins: [getMarkCommonAsExternal(commonOutputFile)],
  }),
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
