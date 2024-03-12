import { existsSync, promises as fsp } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

import { watch } from 'chokidar';
import { build as esBuild } from 'esbuild';
import { jwtDecode } from 'jwt-decode';
import { Issuer, TokenSet } from 'openid-client';

import { ExternalTaskWorker, IExternalTaskWorkerConfig } from '@5minds/processcube_engine_client';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { ChildProcess, fork } from 'node:child_process';
import { IPCMessageType } from '../../common';
import { EngineURL } from './internal/EngineClient';


const DUMMY_IDENTITY: Identity = {
  token: 'ZHVtbXlfdG9rZW4=',
  userId: 'dummy_token',
};
const DELAY_FACTOR = 0.85;
const EXTERNAL_TASK_FILE_NAMES: ReadonlyArray<string> = ['external_task.ts', 'external_task.js'];

const logger = new Logger('processcube_app_sdk:external_task_adapter');
const authorityIsConfigured = process.env.PROCESSCUBE_AUTHORITY_URL !== undefined;
const externalTaskWorkerProcessByPath: Record<string, ChildProcess> = {};

export type ExternalTaskConfig = Omit<IExternalTaskWorkerConfig, 'identity' | 'workerId'>;

/**
 * Subscribe to external tasks.
 * @param {string} customExternalTasksDirPath Optional path to the external tasks directory. Uses the Next.js app directory by default.
 * @returns {Promise<void>} A promise that resolves when the external tasks are subscribed
 * */
export async function subscribeToExternalTasks(customExternalTasksDirPath?: string): Promise<void> {
  if (customExternalTasksDirPath && !existsSync(customExternalTasksDirPath)) {
    throw new Error(
      `Invalid customExternalTasksDirPath. The given path '${customExternalTasksDirPath}' does not exist`,
    );
  }

  const externalTasksDirPath = getExternalTasksDirPath(customExternalTasksDirPath);

  watch(externalTasksDirPath)
    .on('add', async (path) => {
      if (!EXTERNAL_TASK_FILE_NAMES.includes(basename(path))) {
        return;
      }

      await startExternalTaskWorker(path, externalTasksDirPath);
    })
    .on('change', async (path) => {
      if (!EXTERNAL_TASK_FILE_NAMES.includes(basename(path))) {
        return;
      }

      await restartExternalTaskWorker(path, externalTasksDirPath);
    })
    .on('unlink', async (path) => {
      if (!EXTERNAL_TASK_FILE_NAMES.includes(basename(path))) {
        return;
      }

      stopExternalTaskWorker(path);

      delete externalTaskWorkerProcessByPath[path];
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
  if (externalTaskWorkerProcessByPath[pathToExternalTask]) {
    return;
  }
  const directory = dirname(pathToExternalTask);
  const workerfile = getExternalTaskFile(directory);

  if (!workerfile) {
    logger.error(`Could not find external task file in directory '${directory}'`);
    return;
  }

  const transpiledFile = await transpileFile(pathToExternalTask);
  const tokenSet = await getFreshTokenSet();
  const identity = getIdentityForExternalTaskWorkers(tokenSet);
  const relativePath = relative(externalTasksDirPath, directory);
  const topic = getExternalTaskTopicByPath(relativePath);

  const processFile = join(__dirname, 'lib/ExternalTaskWorkerProcess.cjs');
  let externalTaskWorkerProcess = fork(processFile);
  externalTaskWorkerProcess.on('message', async (message: { action: string }) => {
    switch (message.action) {
      case 'createCompleted':
        await startRefreshingIdentityCycle(tokenSet, externalTaskWorkerProcess);
        externalTaskWorkerProcess.send({
          action: 'start',
          payload: {
            topic,
          },
        } satisfies IPCMessageType);
        break;
    }
  });

  externalTaskWorkerProcess.send({
    action: 'create',
    payload: {
      EngineURL,
      topic,
      identity,
      moduleString: transpiledFile,
      fullWorkerFilePath: pathToExternalTask,
    },
  } satisfies IPCMessageType);

  // return externalTaskWorkerProcess;

  // const handler = module.default;
  // const config: IExternalTaskWorkerConfig = {
  //   identity: identity,
  //   ...customConfig,
  //   ...module?.config,
  // };
  // const externalTaskWorker = new ExternalTaskWorker<any, any>(EngineURL, topic, handler, config);
  // externalTaskWorker.onWorkerError((errorType, error, externalTask): void => {
  //   logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
  //     err: error,
  //     type: errorType,
  //     externalTask: externalTask,
  //   });
  // });

  // externalTaskWorker.start();
  // await startRefreshingIdentityCycle(tokenSet, externalTaskWorker);

  externalTaskWorkerProcessByPath[pathToExternalTask] = externalTaskWorkerProcess;
}

/**
 * Restarts the external task worker by stopping and then starting it again.
 *
 * @param pathToExternalTask - The path to the external task.
 * @param externalTasksDirPath - The path to the directory containing external tasks.
 * @returns A promise that resolves when the external task worker has been restarted.
 */
async function restartExternalTaskWorker(pathToExternalTask: string, externalTasksDirPath: string): Promise<void> {
  const workerId = externalTaskWorkerProcessByPath[pathToExternalTask];
  stopExternalTaskWorker(pathToExternalTask);
  await startExternalTaskWorker(pathToExternalTask, externalTasksDirPath, { });
}

/**
 * Stops the external task worker associated with the given path and disposes it.
 * If the worker does not exist, the function returns early.
 *
 * @param pathToExternalTask - The path to the external task.
 */
function stopExternalTaskWorker(pathToExternalTask: string): void {
  const externalTaskWorkerProcess = externalTaskWorkerProcessByPath[pathToExternalTask];

  if (!externalTaskWorkerProcess) {
    return;
  }

  externalTaskWorkerProcess.kill();

  // externalTaskWorker.stop();
  // externalTaskWorker.dispose();
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

async function getFreshTokenSet(): Promise<TokenSet | null> {
  if (!authorityIsConfigured) {
    return null;
  }

  if (
    !process.env.PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID ||
    !process.env.PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET
  ) {
    const error = new Error(
      'Required environment variables PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID and PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET are missing. For help, please refer to our documentation on environment variables at: https://processcube.io/docs/app-sdk/samples/nextjs/external-task-adapter-with-nextjs#authority',
    );

    logger.error(
      `Required environment variables PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID and PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET are missing`,
      {
        err: error,
      },
    );
    throw error;
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
 * @param {ChildProcess} externalTaskWorkerProcess The external task worker process to refresh the identity for
 * @param {number} retries The number of retries to refresh the identity
 * @returns {Promise<void>} A promise that resolves when the identity is refreshed
 * */
async function startRefreshingIdentityCycle(
  tokenSet: TokenSet | null,
  externalTaskWorkerProcess: ChildProcess,
  retries: number = 5,
): Promise<void> {
  let timeout: NodeJS.Timeout;
  const disconnectCallback = () => {
    logger.info('External task worker process IPC channel was disconnected, stopping identity refresh cycle', {
      pid: externalTaskWorkerProcess.pid,
    });
    clearTimeout(timeout);
  };

  try {
    if (!authorityIsConfigured || tokenSet === null) {
      return;
    }

    externalTaskWorkerProcess.once('disconnect', disconnectCallback);

    const expiresIn = await getExpiresInForExternalTaskWorkers(tokenSet);
    const delay = expiresIn * DELAY_FACTOR * 1000;

    timeout = setTimeout(async () => {
      const newTokenSet = await getFreshTokenSet();
      const newIdentity = getIdentityForExternalTaskWorkers(newTokenSet);

      if (externalTaskWorkerProcess.killed) {
        return;
      }

      externalTaskWorkerProcess.send({
        action: 'updateIdentity',
        payload: {
          identity: newIdentity,
        },
      } satisfies IPCMessageType);
      externalTaskWorkerProcess.removeListener('disconnect', disconnectCallback);
      await startRefreshingIdentityCycle(newTokenSet, externalTaskWorkerProcess);
    }, delay);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    logger.error(`Could not refresh identity for external task worker process ${externalTaskWorkerProcess.pid}`, {
      err: error,
      retryCount: retries,
    });

    const delay = 2 * 1000;
    timeout = setTimeout(async () => await startRefreshingIdentityCycle(tokenSet, externalTaskWorkerProcess, retries - 1), delay);
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
    external: ['@opentelemetry/api']
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

function getExternalTasksDirPath(customExternalTasksDirPath?: string): string {
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

  return externalTasksDirPath;
}
