import { ChildProcess, fork } from 'node:child_process';
import { existsSync, promises as fsp } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

import { watch } from 'chokidar';
import { build as esBuild } from 'esbuild';
import { jwtDecode } from 'jwt-decode';
import { Issuer, TokenSet, custom } from 'openid-client';

import { IExternalTaskWorkerConfig } from '@5minds/processcube_engine_client';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';

import { IPCMessageType } from '../../common';
import { EngineURL } from './internal/EngineClient';

export type ExternalTaskConfig = Omit<IExternalTaskWorkerConfig, 'identity' | 'workerId'>;

const DUMMY_IDENTITY: Identity = {
  token: 'ZHVtbXlfdG9rZW4=',
  userId: 'dummy_token',
};
const DELAY_FACTOR = 0.85;
const EXTERNAL_TASK_FILE_NAMES: ReadonlyArray<string> = ['external_task.ts', 'external_task.js'];
const authorityIsConfigured = process.env.PROCESSCUBE_AUTHORITY_URL !== undefined;
const logger = new Logger('processcube_app_sdk:external_task_adapter');

const etwProcesses: Record<string, ChildProcess> = {};
let freshIdentity: Identity;

/**
 * Subscribe to external tasks.
 * @param {string} customEtwRootDirectory Optional path to the external tasks directory. Uses the Next.js app directory by default.
 * @returns {Promise<void>} A promise that resolves when the external tasks are subscribed
 * */
export async function subscribeToExternalTasks(customEtwRootDirectory?: string): Promise<void> {
  if (customEtwRootDirectory && !existsSync(customEtwRootDirectory)) {
    throw new Error(`Invalid customExternalTasksDirPath. The given path '${customEtwRootDirectory}' does not exist`);
  }
  custom.setHttpOptionsDefaults({
    timeout: 100000,
  });

  const tokenSet = await getFreshTokenSet();
  freshIdentity = await getIdentityForExternalTaskWorkers(tokenSet);
  await startRefreshingIdentityCycle(tokenSet);

  const etwRootDirectory = getExternalTasksDirPath(customEtwRootDirectory);
  watch(etwRootDirectory)
    .on('add', async (workerPath) => {
      if (EXTERNAL_TASK_FILE_NAMES.includes(basename(workerPath))) {
        return startExternalTaskWorker(workerPath, etwRootDirectory);
      }
    })
    .on('change', async (workerPath) => {
      if (EXTERNAL_TASK_FILE_NAMES.includes(basename(workerPath))) {
        return restartExternalTaskWorker(workerPath, etwRootDirectory);
      }
    })
    .on('unlink', async (workerPath) => {
      if (EXTERNAL_TASK_FILE_NAMES.includes(basename(workerPath))) {
        stopExternalTaskWorker(workerPath);
      }
    })
    .on('error', (error) => logger.error(`Watcher error: ${error}`));
}

/**
 * Starts an external task worker.
 *
 * @param workerPath The path to the external task file.
 * @param etwRootDirectory The path to the directory containing external tasks.
 * @returns A Promise that resolves when the external task worker process has started.
 */
async function startExternalTaskWorker(workerPath: string, etwRootDirectory: string): Promise<void> {
  const workerDirectory = dirname(workerPath);
  const workerDirectoryContent = await fsp.readdir(workerDirectory);
  const workerFilesFound = workerDirectoryContent.filter((file) => EXTERNAL_TASK_FILE_NAMES.includes(file)).length;
  if (workerFilesFound > 1) {
    logger.error(
      `Multiple external task files found in directory ${workerDirectory}. Stopping all external task workers for this directory.`,
    );
    if (etwProcesses[workerDirectory]) {
      stopExternalTaskWorker(workerPath);
    }
    return;
  }

  const moduleString = await transpileFile(workerPath);
  const relativeWorkerPath = relative(etwRootDirectory, workerDirectory);
  const topic = getExternalTaskTopicByPath(relativeWorkerPath);

  const etwProcessPath = join(__dirname, 'lib/ExternalTaskWorkerProcess.cjs');
  const workerProcess = fork(etwProcessPath, {
    env: {
       ...process.env,
      PROCESSCUBE_ENGINE_URL: EngineURL
    },
  });
  etwProcesses[workerDirectory] = workerProcess;
  workerProcess.once('disconnect', () => {
    delete etwProcesses[workerDirectory];
  });

  workerProcess.send({
    action: 'create',
    payload: {
      topic,
      identity: freshIdentity,
      moduleString,
      workerPath,
    },
  } satisfies IPCMessageType);
}

/**
 * Restarts the external task worker by stopping and then starting it again.
 *
 * @param workerPath - The path to the external task.
 * @param etwRootDirectory - The path to the directory containing external tasks.
 * @returns A promise that resolves when the external task worker restart has been started.
 */
async function restartExternalTaskWorker(workerPath: string, etwRootDirectory: string): Promise<void> {
  const workerDirectory = dirname(workerPath);
  const workerProcess = etwProcesses[workerDirectory];
  if (!workerProcess) {
    return startExternalTaskWorker(workerPath, etwRootDirectory);
  }
  const moduleString = await transpileFile(workerPath);
  const relativeWorkerPath = relative(etwRootDirectory, workerDirectory);
  const topic = getExternalTaskTopicByPath(relativeWorkerPath);
  workerProcess.send({
    action: 'restart',
    payload: {
      topic,
      identity: freshIdentity,
      moduleString,
      workerPath,
    },
  } satisfies IPCMessageType);
}

/**
 * Stops the external task worker associated with the given path and disposes it.
 * If the worker does not exist, the function returns early.
 *
 * @param workerPath - The path to the external task.
 */
function stopExternalTaskWorker(workerPath: string): void {
  const workerDirectory = dirname(workerPath);
  const externalTaskWorkerProcess = etwProcesses[workerDirectory];

  if (!externalTaskWorkerProcess) {
    return;
  }

  externalTaskWorkerProcess.kill();
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
 * @returns {Promise<void>} A promise that resolves when the timer for refreshing the identity is initialized
 * */
async function startRefreshingIdentityCycle(tokenSet: TokenSet | null): Promise<void> {
  let retries = 5;

  if (!authorityIsConfigured || tokenSet === null) {
    return;
  }

  const expiresIn = await getExpiresInForExternalTaskWorkers(tokenSet);
  const delay = expiresIn * DELAY_FACTOR * 1000;

  const refresh = async () => {
    try {
      const newTokenSet = await getFreshTokenSet();
      freshIdentity = getIdentityForExternalTaskWorkers(newTokenSet);

      for (const externalTaskWorkerProcess of Object.values(etwProcesses)) {
        externalTaskWorkerProcess.send({
          action: 'updateIdentity',
          payload: {
            identity: freshIdentity,
          },
        } satisfies IPCMessageType);
      }

      retries = 5;
      setTimeout(refresh, delay);
    } catch (error) {
      if (retries === 0) {
        logger.error(
          'Could not refresh identity for external task worker processes. Stopping all external task workers.',
          { error },
        );
        for (const externalTaskWorkerProcess of Object.values(etwProcesses)) {
          externalTaskWorkerProcess.kill();
        }
        return;
      }
      logger.error('Could not refresh identity for external task worker processes.', {
        error,
        retryCount: retries,
      });
      retries--;

      const delay = 2 * 1000;
      setTimeout(refresh, delay);
    }
  };

  setTimeout(refresh, delay);
}

/**
 * Transpile a file to javascript.
 * @param {string} entryPoint The path to the file
 * @returns {Promise<any>} A promise that resolves with the content of the transpiled file
 * */
async function transpileFile(entryPoint: string): Promise<any> {
  const result = await esBuild({
    entryPoints: [entryPoint],
    write: false,
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    external: ['@opentelemetry/api'],
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
