import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { basename, dirname, join, relative } from 'node:path';
import { build as esBuild } from 'esbuild';
import { promises as fsp, existsSync } from 'node:fs';
import { Issuer, TokenSet } from 'openid-client';
import { jwtDecode } from 'jwt-decode';
import { watch } from 'chokidar';

import { EngineURL } from './internal/EngineClient';

const DUMMY_IDENTITY: Identity = {
  token: 'ZHVtbXlfdG9rZW4=',
  userId: 'dummy_token',
};
const DELAY_FACTOR = 0.85;
const EXTERNAL_TASK_FILE_NAMES: ReadonlyArray<string> = ['external_task.ts', 'external_task.js'];

const logger = new Logger('processcube_app_sdk:external_task_adapter');
const authorityIsConfigured = process.env.PROCESSCUBE_AUTHORITY_URL !== undefined;
const externalTaskWorkerByPath: Record<string, ExternalTaskWorker<any, any>> = {};

export type ExternalTaskConfig = Omit<IExternalTaskWorkerConfig, 'identity' | 'workerId'>;

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

  if (customExternalTasksDirPath && !existsSync(customExternalTasksDirPath)) {
    throw new Error(
      `Invalid customExternalTasksDirPath. The given path '${customExternalTasksDirPath}' does not exist`,
    );
  }

  if (!externalTasksDirPath) {
    throw new Error('Could not find external tasks directory');
  }

  watch(externalTasksDirPath)
    .on('add', async (path) => {
      if (!EXTERNAL_TASK_FILE_NAMES.includes(basename(path))) {
        return;
      }

      startExternalTaskWorker(path, externalTasksDirPath as string);
    })
    .on('change', async (path) => {
      if (!EXTERNAL_TASK_FILE_NAMES.includes(basename(path))) {
        return;
      }

      restartExternalTaskWorker(path, externalTasksDirPath as string);
    })
    .on('unlink', async (path) => {
      if (!EXTERNAL_TASK_FILE_NAMES.includes(basename(path))) {
        return;
      }

      stopExternalTaskWorker(path, externalTasksDirPath as string);
    })
    .on('error', (error) => logger.info(`Watcher error: ${error}`));
}

/**
 * Starts an external task worker.
 *
 * @param pathToExternalTask The path to the external task file.
 * @param externalTasksDirPath The path to the directory containing external tasks.
 * @returns A Promise that resolves when the external task worker has started.
 */
async function startExternalTaskWorker(
  pathToExternalTask: string,
  externalTasksDirPath: string,
  customConfig?: IExternalTaskWorkerConfig,
): Promise<void> {
  const directory = dirname(pathToExternalTask);
  const workerfile = getExternalTaskFile(directory);

  if (!workerfile) {
    logger.error(`Could not find external task file in directory '${directory}'`);
    return;
  }

  const transpiledFile = await transpileFile(pathToExternalTask);
  const module = await createModule(transpiledFile, pathToExternalTask);

  if (module.default === undefined) {
    logger.info(
      `External task file recognized at ${pathToExternalTask}. Please export a default handler function. For more information see https://processcube.io/docs/app-sdk/samples/external-task-adapter#external-tasks-entwickeln`,
    );
    return;
  }

  const tokenSet = authorityIsConfigured ? await getFreshTokenSet() : null;
  const identity = getIdentityForExternalTaskWorkers(tokenSet);

  const relativePath = relative(externalTasksDirPath, directory);

  const topic = getExternalTaskTopicByPath(relativePath);
  const handler = module.default;
  const config: IExternalTaskWorkerConfig = {
    identity: identity,
    ...customConfig,
    ...module?.config,
  };
  const externalTaskWorker = new ExternalTaskWorker<any, any>(EngineURL, topic, handler, config);
  externalTaskWorker.onWorkerError((errorType, error, externalTask): void => {
    logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
      err: error,
      type: errorType,
      externalTask: externalTask,
    });
  });

  externalTaskWorker.start();
  await startRefreshingIdentityCycle(tokenSet, externalTaskWorker);

  logger.info(`Started external task ${externalTaskWorker.workerId} for topic ${topic}`);

  externalTaskWorkerByPath[pathToExternalTask] = externalTaskWorker;
}

/**
 * Restarts the external task worker by stopping and then starting it again.
 *
 * @param pathToExternalTask - The path to the external task.
 * @param externalTasksDirPath - The path to the directory containing external tasks.
 * @returns A promise that resolves when the external task worker has been restarted.
 */
async function restartExternalTaskWorker(pathToExternalTask: string, externalTasksDirPath: string): Promise<void> {
  const workerId = externalTaskWorkerByPath[pathToExternalTask]?.workerId;
  stopExternalTaskWorker(pathToExternalTask, externalTasksDirPath);
  await startExternalTaskWorker(pathToExternalTask, externalTasksDirPath, { workerId });
}

/**
 * Stops the external task worker associated with the given path and disposes it.
 * If the worker does not exist, the function returns early.
 *
 * @param pathToExternalTask - The path to the external task.
 * @param externalTasksDirPath - The path to the directory containing external tasks.
 */
function stopExternalTaskWorker(pathToExternalTask: string, externalTasksDirPath: string): void {
  const externalTaskWorker = externalTaskWorkerByPath[pathToExternalTask];

  if (!externalTaskWorker) {
    return;
  }

  externalTaskWorker.stop();
  externalTaskWorker.dispose();
  delete externalTaskWorkerByPath[pathToExternalTask];

  const directory = dirname(pathToExternalTask);
  const relativePath = relative(externalTasksDirPath, directory);
  const topic = getExternalTaskTopicByPath(relativePath);

  logger.info(`Stopped external task ${externalTaskWorker.workerId} for topic '${topic}'`, {
    reason: `External Task for topic '${topic}' was removed`,
    workerId: externalTaskWorker.workerId,
    topic: topic,
  });
}

async function getExternalTaskFile(directory: string): Promise<string | null> {
  const files = await fsp.readdir(directory);
  const externalTaskFiles = files.filter((file) => EXTERNAL_TASK_FILE_NAMES.includes(file));

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
    client_id: process.env.PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID as string,
    client_secret: process.env.PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET as string,
  });
  const tokenSet = await client.grant({
    grant_type: 'client_credentials',
    scope: 'engine_etw',
  });

  return tokenSet;
}

function getIdentityForExternalTaskWorkers(tokenSet: TokenSet | null): Identity {
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
async function startRefreshingIdentityCycle(
  tokenSet: TokenSet | null,
  externalTaskWorker: ExternalTaskWorker<any, any>,
  retries: number = 5,
): Promise<void> {
  try {
    if (!authorityIsConfigured || tokenSet === null) {
      return;
    }

    // Falls was beim Starten schiefgegangen ist
    if (!externalTaskWorker.pollingIsActive) {
      return;
    }

    const expiresIn = await getExpiresInForExternalTaskWorkers(tokenSet);
    const delay = expiresIn * DELAY_FACTOR * 1000;

    setTimeout(async () => {
      // Um nach dem Timeout sofort zu stoppen
      if (!externalTaskWorker.pollingIsActive) {
        return;
      }

      const newTokenSet = await getFreshTokenSet();
      const newIdentity = getIdentityForExternalTaskWorkers(newTokenSet);
      externalTaskWorker.identity = newIdentity;
      await startRefreshingIdentityCycle(newTokenSet, externalTaskWorker, retries);
    }, delay);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    logger.error(`Could not refresh identity for external task worker ${externalTaskWorker.workerId}`, {
      err: error,
      workerId: externalTaskWorker.workerId,
      retryCount: retries,
    });

    const delay = 2 * 1000;
    setTimeout(async () => await startRefreshingIdentityCycle(tokenSet, externalTaskWorker, retries - 1), delay);
  }
}

/**
 * Transpile a file to javascript.
 * @param {string} entryPoint The path to the file
 * @returns {Promise<any>} A promise that resolves with the module exports of the transpiled file
 * */
async function transpileFile(entryPoint: string): Promise<any> {
  const result = await esBuild({
    entryPoints: [entryPoint],
    write: false,
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
  });

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

  return result.outputFiles[0].text;
}

/**
 * Creates a module from a given source code string and filename.
 * @param src - The source code string of the module.
 * @param filename - The filename of the module.
 * @returns The exported object from the compiled module.
 * @throws If there is an error while compiling or requiring the module.
 */
async function createModule(src: string, filename: string) {
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
    throw new Error('Could not determine the time until the access token for external task workers expires');
  }

  return expiresIn;
}

/**
 * Returns the external task topic derived from the given path.
 *
 * @param path - The path to derive the external task topic from.
 * @returns The external task topic.
 */
function getExternalTaskTopicByPath(path: string): string {
  return path.replace(/^\.\/+|\([^)]+\)|^\/*|\/*$/g, '').replace(/[\/]{2,}/g, '/');
}
