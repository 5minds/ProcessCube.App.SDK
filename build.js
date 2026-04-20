import * as esbuild from 'esbuild';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
 * Fixes two ESM resolution issues in the output:
 *
 * 1. Rewrites bare Node.js built-in imports (`fs`, `path`, …) to use the
 *    `node:` protocol prefix, which is required in ESM context.
 *
 * 2. Appends `.js` to bare external subpath imports (e.g. `next/headers` →
 *    `next/headers.js`) so that Node's strict ESM resolver can find them even
 *    when the target package does not ship an `exports` map.
 */
const NODE_BUILTINS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
]);

// Cache for package.json exports field lookups
const _pkgExportsCache = new Map();
function packageHasExports(pkgName) {
  if (_pkgExportsCache.has(pkgName)) return _pkgExportsCache.get(pkgName);
  let hasExports = false;
  try {
    // Resolve the package's main entry, then walk up to find its package.json.
    // We can't use require.resolve(pkg + '/package.json') because packages
    // with an exports map often don't export ./package.json.
    const mainPath = require.resolve(pkgName);
    let dir = mainPath;
    while (dir !== '/') {
      dir = dir.substring(0, dir.lastIndexOf('/'));
      const candidate = dir + '/package.json';
      if (fs.existsSync(candidate)) {
        const pkgJson = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
        if (pkgJson.name === pkgName) {
          hasExports = pkgJson.exports != null;
          break;
        }
      }
    }
  } catch {}
  _pkgExportsCache.set(pkgName, hasExports);
  return hasExports;
}

const fixEsmImports = {
  name: 'fixEsmImports',
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      // Skip imports that already use the node: protocol
      if (args.path.startsWith('node:')) return null;

      // 1) Rewrite bare Node built-ins → node: prefix
      //    Handles both exact matches ("fs") and subpath imports ("fs/promises")
      const rootSegment = args.path.split('/')[0];
      if (NODE_BUILTINS.has(rootSegment)) {
        return { path: 'node:' + args.path, external: true };
      }

      const parts = args.path.split('/');

      // Skip packages that should be bundled (e.g. bpmn-js, diagram-js)
      const pkgName = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      if (bundlePackages.includes(pkgName)) return null;

      // 2) Append .js to subpath imports (e.g. "next/headers" → "next/headers.js")
      //    Only for packages WITHOUT an exports map — packages with exports
      //    handle their own subpath resolution and adding .js would break them.
      const isScopedSubpath = parts[0].startsWith('@') && parts.length > 2;
      const isPlainSubpath = !parts[0].startsWith('@') && parts.length > 1;
      if (!isScopedSubpath && !isPlainSubpath) return null;

      if (packageHasExports(pkgName)) return null;

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
    plugins: [getMarkCommonAsExternal(commonOutputFile), fixEsmImports],
    external: externalPackages,
  }),
  //client
  build({
    ...ESMODULE_CONFIG,
    entryPoints: ['src/client/index.ts'],
    outdir: 'build/client',
    plugins: [getMarkCommonAsExternal(commonOutputFile), fixEsmImports],
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
