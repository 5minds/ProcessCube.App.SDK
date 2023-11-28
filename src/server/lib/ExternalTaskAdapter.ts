import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { join, relative } from 'node:path';
import { build as esBuild } from 'esbuild';
import { promises as fsp, PathLike, existsSync } from 'node:fs';
import { Issuer, TokenSet } from 'openid-client';
import jwtDecode from 'jwt-decode';
import { watch } from 'chokidar';

import { EngineURL } from './internal/EngineClient';

const DUMMY_IDENTITY: Identity = {
  token: 'ZHVtbXlfdG9rZW4=',
  userId: 'dummy_token',
};
const DELAY_FACTOR = 0.85;
const EXTERNAL_TASK_FILE_NAME = 'external_task.ts';

const logger = new Logger('processcube_app_sdk:external_task_adapter');
const authorityIsConfigured = process.env.PROCESSCUBE_AUTHORITY_URL !== undefined;

export type ExternalTaskConfig = Omit<IExternalTaskWorkerConfig, 'identity' | 'workerId'>;

/**
 * Subscribe to external tasks.
 * @param {string} customExternalTasksDirPath Optional path to the external tasks directory. Uses the Next.js app directory by default.
 * @returns {Promise<void>} A promise that resolves when the external tasks are subscribed
 * */
export async function subscribeToExternalTasks(customExternalTasksDirPath?: string): Promise<void> {
  let externalTasksDirPath = await getExternalTasksDirPath(customExternalTasksDirPath ?? undefined);

  const globalExternalTaskWatcher = watch(externalTasksDirPath);

  globalExternalTaskWatcher.on('add', async (path) => {
    const file = path.split('/').pop();
    let directory = '';

    let isExternalTaskFile = file === EXTERNAL_TASK_FILE_NAME;

    if (!isExternalTaskFile || !file) {
      return;
    } else {
      directory = path.replace(file, '');
      if (directory === externalTasksDirPath) return;
    }

    startExternalTask(externalTasksDirPath, directory);
  });
}

/**
 * Start an external task.
 * @param externalTasksDirPath The chosen directory for the external tasks
 * @param directory The directory of the external task which will be started
 * @returns {Promise<void>} A promise that resolves when the external tasks and their watchers are started
 */
async function startExternalTask(externalTasksDirPath: string, directory: string): Promise<void> {
  const workerFile = await getExternalTaskFile(directory);

  if (!workerFile) {
    return;
  }

  const fullWorkerFilePath = join(directory, workerFile);

  const topic = relative(externalTasksDirPath, directory)
    .replace(/^\.\/+|\([^)]+\)|^\/*|\/*$/g, '')
    .replace(/[\/]{2,}/g, '/');

  let externalTaskWorker = await startExternalTaskWorker(fullWorkerFilePath, topic);

  addExternalTaskWatcher(directory, externalTaskWorker, fullWorkerFilePath, topic);
}

/**
 * Add a watcher for an external task.
 * @param directory The directory of the external task which will be watched
 * @param externalTaskWorker The Instance of the external task worker
 * @param fullWorkerFilePath The Full Path to the external task file
 * @param topic The Topic on which the external task is subscribed
 */
async function addExternalTaskWatcher(
  directory: string,
  externalTaskWorker: ExternalTaskWorker<any, any>,
  fullWorkerFilePath: string,
  topic: string,
) {
  const etwWatcher = watch(directory);

  etwWatcher
    .on('change', async () => {
      externalTaskWorker.dispose();
      externalTaskWorker.stop();

      logger.info(`Restarting external task ${externalTaskWorker.workerId} for topic ${topic}`, {
        reason: `Code changes in External Task for ${topic}`,
        workerId: externalTaskWorker.workerId,
        topic: topic,
      });

      externalTaskWorker = await startExternalTaskWorker(fullWorkerFilePath, topic, externalTaskWorker.workerId);
    })
    .on('unlink', async () => {
      externalTaskWorker.dispose();
      externalTaskWorker.stop();

      logger.info(`Stopping external task ${externalTaskWorker.workerId} for topic ${topic}`, {
        reason: `External Task for ${topic} was removed`,
        workerId: externalTaskWorker.workerId,
        topic: topic,
      });
      etwWatcher.close();
    })
    .on('error', (error) => logger.info(`Watcher error: ${error}`));
}

/**
 * Get the path to the external tasks directory.
 * @param customExternalTasksDirPath Optional path to the external tasks directory. Uses the Next.js app directory by default.
 * @returns {Promise<string>} A promise that resolves when the external tasks directory is determined
 */
async function getExternalTasksDirPath(customExternalTasksDirPath?: string): Promise<string> {
  let externalTasksDirPath: string | undefined;
  const potentialPaths = [customExternalTasksDirPath, join(process.cwd(), 'app/'), join(process.cwd(), 'src', 'app/')];

  for (const path of potentialPaths) {
    if (path && existsSync(path)) {
      externalTasksDirPath = path;
      break;
    }
  }

  if (!externalTasksDirPath) {
    throw new Error('Could not find external tasks directory');
  }

  return externalTasksDirPath;
}

/**
 * start an external task worker for an external task.
 * @param fullWorkerFilePath The full path to the external task file
 * @param topic The topic on which the external task should be subscribed
 * @param externalTaskWorkerId optional ID to restart a specific external task worker
 * @returns {Promise<ExternalTaskWorker<any, any>>} A promise that resolves when the external task worker is started
 */
async function startExternalTaskWorker(
  fullWorkerFilePath: string,
  topic: string,
  externalTaskWorkerId?: string,
): Promise<ExternalTaskWorker<any, any>> {
  const module = await transpileTypescriptFile(fullWorkerFilePath);

  const tokenSet = authorityIsConfigured ? await getFreshTokenSet() : null;
  const identity = await getIdentityForExternalTaskWorkers(tokenSet);

  let config: IExternalTaskWorkerConfig = {
    identity: identity,
    ...module?.config,
  };

  if (externalTaskWorkerId) {
    config = {
      ...config,
      workerId: externalTaskWorkerId,
    };
  }

  const handler = module.default;

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

  return externalTaskWorker;
}

async function getExternalTaskFile(directory: string): Promise<string | null> {
  const files = await fsp.readdir(directory);
  const externalTaskFiles = files.filter((file) => file === EXTERNAL_TASK_FILE_NAME);

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

/**
 * get the identity for external task workers
 * @param tokenSet the tokenset to get the identity for External Task Workers, if not provided a dummy identity is returned
 * @returns {Promise<Identity>} A promise that resolves with the identity for external task workers
 */
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
async function startRefreshingIdentityCycle(
  tokenSet: TokenSet | null,
  externalTaskWorker: ExternalTaskWorker<any, any>,
  retries: number = 5,
): Promise<void> {
  try {
    if (!authorityIsConfigured || tokenSet === null || !externalTaskWorker.pollingIsActive) {
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
      const newIdentity = await getIdentityForExternalTaskWorkers(newTokenSet);
      externalTaskWorker.identity = newIdentity;
      await startRefreshingIdentityCycle(newTokenSet, externalTaskWorker);
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
