import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { EngineURL } from './internal/EngineClient';
import { join, relative, basename } from 'node:path';
import { build as esBuild } from 'esbuild';
import { promises as fsp, PathLike, existsSync } from 'node:fs';
import { Issuer, TokenSet } from 'openid-client';
import jwtDecode from 'jwt-decode';

const DUMMY_IDENTITY: Identity = {
  token: 'ZHVtbXlfdG9rZW4=',
  userId: 'dummy_token',
};
const DELAY_FACTOR = 0.85;
const EXTERNAL_TASK_FILE_NAME = 'external_task';

const logger = new Logger('processcube_app_sdk:external_task_adapter');
const authorityIsConfigured = process.env.PROCESSCUBE_AUTHORITY_URL !== undefined;

/**
 * Subscribe to external tasks.
 * @param {string} customExternalTasksDirPath Optional path to the external tasks directory. Uses the Next.js app directory by default.
 * @returns {Promise<void>} A promise that resolves when the external tasks are subscribed
 * */
export async function subscribeToExternalTasks(customExternalTasksDirPath?: string): Promise<void> {
  let externalTasksDirPath: string | undefined;
  const potentialPaths = [customExternalTasksDirPath, join(process.cwd(), 'app'), join(process.cwd(), 'src', 'app')];

  for (const path of potentialPaths) {
    if (path && existsSync(path)) {
      externalTasksDirPath = path;
      break;
    }
  }

  if (!externalTasksDirPath) {
    throw new Error('Could not find external tasks directory');
  }

  const directories = await getDirectories(externalTasksDirPath);

  for (const directory of directories) {
    const workerFile = await getExternalTaskFile(directory);

    if (!workerFile) {
      continue;
    }

    const fullWorkerFilePath = join(directory, workerFile);
    const module = await transpileTypescriptFile(fullWorkerFilePath);
    const tokenSet = authorityIsConfigured ? await getFreshTokenSet() : null;

    const config: IExternalTaskWorkerConfig = {
      identity: await getIdentityForExternalTaskWorkers(tokenSet),
      ...module?.config,
    };
    const handler = module.default;
    const topic = relative(externalTasksDirPath, directory).replace(/^\.\/+/, '');

    const externalTaskWorker = new ExternalTaskWorker<any, any>(EngineURL, topic, handler, config);
    await startRefreshingIdentity(tokenSet, externalTaskWorker);

    logger.info(`Starting external task worker ${externalTaskWorker.workerId} for topic '${topic}'`);

    externalTaskWorker.onWorkerError((errorType, error, externalTask): void => {
      logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
        err: error,
        type: errorType,
        externalTask: externalTask,
      });
    });

    externalTaskWorker.start();
  }
}

async function getExternalTaskFile(directory: string): Promise<string | null> {
  const files = await fsp.readdir(directory);
  const externalTaskFiles = files.filter((file) => file.startsWith(EXTERNAL_TASK_FILE_NAME) && file.endsWith('.ts'));

  if (externalTaskFiles.length === 0) {
    return null;
  }

  if (externalTaskFiles.length > 1) {
    throw new Error(`Found more than one external task file in directory '${directory}'`);
  }

  return externalTaskFiles[0];
}

async function getFreshTokenSet(): Promise<TokenSet> {
  if (!authorityIsConfigured) {
    throw new Error('No authority is configured');
  }

  const issuer = await Issuer.discover(process.env.PROCESSCUBE_AUTHORITY_URL as string);
  const client = new issuer.Client({
    client_id: process.env.EXTERNAL_TASK_WORKER_CLIENT_ID as string,
    client_secret: process.env.EXTERNAL_TASK_WORKER_CLIENT_SECRET as string,
  });
  const tokenSet = await client.grant({
    grant_type: 'client_credentials',
    scope: 'engine_etw',
  });

  return tokenSet;
}

async function getIdentityForExternalTaskWorkers(tokenSet: TokenSet | null): Promise<Identity> {
  if (!authorityIsConfigured || tokenSet === null) {
    return DUMMY_IDENTITY;
  }

  const accessToken = tokenSet.access_token as string;
  const decodedToken = jwtDecode<Record<string, unknown>>(accessToken);

  return {
    token: tokenSet.access_token as string,
    userId: decodedToken.sub as string,
  };
}

/**
 * Start refreshing the identity in regular intervals.
 * @param {TokenSet | null} tokenSet The token set to refresh the identity for
 * @param {ExternalTaskWorker<any, any>} externalTaskWorker The external task worker to refresh the identity for
 * @param {number} retries The number of retries to refresh the identity
 * @returns {Promise<void>} A promise that resolves when the identity is refreshed
 * */
async function startRefreshingIdentity(
  tokenSet: TokenSet | null,
  externalTaskWorker: ExternalTaskWorker<any, any>,
  retries: number = 5
): Promise<void> {
  try {
    if (!authorityIsConfigured || tokenSet === null) {
      return;
    }

    const expiresIn = await getExpiresInForExternalTaskWorkers(tokenSet);
    const delay = expiresIn * DELAY_FACTOR * 1000;

    setTimeout(async () => {
      const newTokenSet = await getFreshTokenSet();
      const newIdentity = await getIdentityForExternalTaskWorkers(newTokenSet);
      externalTaskWorker.identity = newIdentity;
      await startRefreshingIdentity(newTokenSet, externalTaskWorker);
    }, delay);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    logger.error(`Could not refresh identity for external task worker ${externalTaskWorker.workerId}`, {
      err: error,
      workerId: externalTaskWorker.workerId,
    });

    const delay = 2 * 1000;
    setTimeout(async () => await startRefreshingIdentity(tokenSet, externalTaskWorker, retries - 1), delay);
  }
}

/**
 * Transpile a typescript file to javascript.
 * @param {string} entryPoint The path to the typescript file
 * @returns {Promise<any>} A promise that resolves with the module exports of the transpiled file
 * */
async function transpileTypescriptFile(entryPoint: string): Promise<any> {
  const result = await esBuild({
    entryPoints: [entryPoint],
    write: false,
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
  });

  const moduleString = result.outputFiles[0].text;
  const moduleExports = requireFromString(moduleString, entryPoint);

  if (result.errors.length > 0) {
    logger.error(`Could not transpile file at '${entryPoint}'`, {
      errors: result.errors,
    });
    throw new Error(`Could not transpile file at '${entryPoint}'`);
  }

  if (result.warnings.length > 0) {
    logger.warn(`Transpiled file at '${entryPoint}' with warnings`, {
      warnings: result.warnings,
    });
  }

  return moduleExports;
}

/**
 * Recursively get all directories in a directory.
 * It gives the full path to the directory.
 * @param {PathLike} source The directory to search in
 * @returns A list of all directories in the directory
 **/
async function getDirectories(source: PathLike): Promise<string[]> {
  const dirents = await fsp.readdir(source, { withFileTypes: true });
  const directories = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = join(source.toString(), dirent.name);

      return dirent.isDirectory() ? [fullPath, ...(await getDirectories(fullPath))] : [];
    })
  );

  return Array.prototype.concat(...directories);
}

/**
 * Get the time in seconds until the current access token expires.
 * @returns {Promise<number>} A promise that resolves with the time in seconds until the current access token expires
 * */
async function getExpiresInForExternalTaskWorkers(tokenSet: TokenSet): Promise<number> {
  let expiresIn = tokenSet.expires_in;

  if (!expiresIn && tokenSet.expires_at) {
    expiresIn = Math.floor(tokenSet.expires_at - Date.now() / 1000);
  }

  if (expiresIn === undefined) {
    throw new Error('Could not get expires_in for external task workers');
  }

  return expiresIn;
}

/**
 * Require a module from a string.
 * @param {string} src The source code of the module
 * @param {string} filename The filename of the module
 * @returns The module exports of the module
 * */
function requireFromString(src: string, filename: string) {
  try {
    var Module = module.constructor as any;
    var m = new Module();
    m._compile(src, filename);

    return m.exports;
  } catch (error) {
    logger.error(`Could not require module from string`, {
      err: error,
    });

    throw error;
  }
}
