import { watch } from 'chokidar';
import { build as esBuild } from 'esbuild';
import { jwtDecode } from 'jwt-decode';
import { ChildProcess, fork } from 'node:child_process';
import { existsSync, promises as fsp } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
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
const etwProcessRestarts: Record<string, { count: number; timestamp: number }> = {};
let freshIdentity: Identity;
let refreshCycleActive = false;

const MAX_RESTART_ATTEMPTS = 6;
const RESTART_WINDOW_MS = 300000; // 5 minutes
const MAX_RESTART_DELAY_MS = 30000;
const INITIAL_TOKEN_MAX_RETRIES = 10;
const INITIAL_TOKEN_MAX_BACKOFF_MS = 30_000;
const REFRESH_TOKEN_MAX_RETRIES = 10;
const REFRESH_TOKEN_MAX_BACKOFF_MS = 60_000;

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

  const tokenSet = await getFreshTokenSetWithRetry();
  freshIdentity = getIdentityForExternalTaskWorkers(tokenSet);
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
    logger.error(`Multiple external task files found in directory ${workerDirectory}. Stopping all external task workers for this directory.`);
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
      PROCESSCUBE_ENGINE_URL: EngineURL,
    },
  });
  etwProcesses[workerDirectory] = workerProcess;
  workerProcess.once('disconnect', () => {
    delete etwProcesses[workerDirectory];
  });

  workerProcess.on('error', (error) => {
    logger.error(`External Task Worker process error for ${topic}`, {
      error,
      topic,
      workerDirectory,
    });
  });

  workerProcess.on('exit', (code, signal) => {
    logger.info(`External Task Worker process exited for ${topic}`, {
      code,
      signal,
      topic,
      workerDirectory,
    });
    delete etwProcesses[workerDirectory];

    // Restart on error exit codes (3 = worker error, 4 = uncaught exception)
    if (code === 3 || code === 4) {
      if (shouldRestartProcess(workerDirectory)) {
        const restartCount = etwProcessRestarts[workerDirectory]?.count ?? 1;
        const delay = Math.min(1000 * Math.pow(2, restartCount - 1), MAX_RESTART_DELAY_MS);
        logger.info(`Scheduling restart for ${topic} in ${delay}ms (attempt ${restartCount}/${MAX_RESTART_ATTEMPTS})`, {
          delay,
          restartCount,
          exitCode: code,
          topic,
          workerDirectory,
        });
        setTimeout(async () => {
          try {
            if (authorityIsConfigured && !refreshCycleActive) {
              logger.info('Token refresh cycle is not active, restarting it before worker restart');
              const tokenSet = await getFreshTokenSetWithRetry();
              freshIdentity = getIdentityForExternalTaskWorkers(tokenSet);
              await startRefreshingIdentityCycle(tokenSet);
            }
            await startExternalTaskWorker(workerPath, etwRootDirectory);
          } catch (error) {
            logger.error(`Failed to restart External Task Worker process for ${topic}`, {
              error,
              topic,
              workerDirectory,
            });
          }
        }, delay);
      } else {
        logger.error(`External Task Worker process for ${topic} reached maximum restart attempts`, {
          exitCode: code,
          topic,
          workerDirectory,
        });
      }
    }
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

  if (!process.env.PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID || !process.env.PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET) {
    const error = new Error(
      'Required environment variables PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID and PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET are missing. For help, please refer to our documentation on environment variables at: https://processcube.io/docs/app-sdk/samples/nextjs/external-task-adapter-with-nextjs#authority',
    );

    logger.error(`Required environment variables PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID and PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET are missing`, {
      err: error,
    });
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

async function getFreshTokenSetWithRetry(): Promise<TokenSet | null> {
  if (!authorityIsConfigured) {
    return null;
  }

  for (let attempt = 1; attempt <= INITIAL_TOKEN_MAX_RETRIES; attempt++) {
    try {
      return await getFreshTokenSet();
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), INITIAL_TOKEN_MAX_BACKOFF_MS);
      logger.error(`Failed to fetch initial token set (attempt ${attempt}/${INITIAL_TOKEN_MAX_RETRIES}), retrying in ${delay}ms`, {
        error,
        attempt,
        delay,
      });

      if (attempt === INITIAL_TOKEN_MAX_RETRIES) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
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
  if (!authorityIsConfigured || tokenSet === null) {
    return;
  }

  if (refreshCycleActive) {
    return;
  }
  refreshCycleActive = true;

  let retryCount = 0;

  const expiresIn = await getExpiresInForExternalTaskWorkers(tokenSet);
  const refreshDelay = expiresIn * DELAY_FACTOR * 1000;

  const refresh = async () => {
    try {
      const newTokenSet = await getFreshTokenSet();
      freshIdentity = getIdentityForExternalTaskWorkers(newTokenSet);

      for (const [workerDir, workerProcess] of Object.entries(etwProcesses)) {
        try {
          workerProcess.send({
            action: 'updateIdentity',
            payload: {
              identity: freshIdentity,
            },
          } satisfies IPCMessageType);
        } catch (sendError) {
          logger.warn(`Failed to send identity update to worker process ${workerDir}`, { sendError });
        }
      }

      retryCount = 0;
      setTimeout(refresh, refreshDelay);
    } catch (error) {
      retryCount++;
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), REFRESH_TOKEN_MAX_BACKOFF_MS);

      if (retryCount <= REFRESH_TOKEN_MAX_RETRIES) {
        logger.error(`Could not refresh identity (attempt ${retryCount}/${REFRESH_TOKEN_MAX_RETRIES}), retrying in ${backoffDelay}ms`, {
          error,
          attempt: retryCount,
          delay: backoffDelay,
        });
      } else {
        logger.error(`Could not refresh identity (attempt ${retryCount}), continuing to retry every ${backoffDelay}ms`, {
          error,
          attempt: retryCount,
          delay: backoffDelay,
        });
      }

      setTimeout(refresh, backoffDelay);
    }
  };

  setTimeout(refresh, refreshDelay);
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

/**
 * Checks if a process should be restarted based on the restart history.
 * Prevents restart loops by limiting restarts within a time window.
 *
 * @param workerDirectory - The directory of the worker process.
 * @returns True if the process should be restarted, false otherwise.
 */
function shouldRestartProcess(workerDirectory: string): boolean {
  const now = Date.now();
  const restartInfo = etwProcessRestarts[workerDirectory];

  if (!restartInfo || now - restartInfo.timestamp > RESTART_WINDOW_MS) {
    // First restart or outside the time window - reset counter
    etwProcessRestarts[workerDirectory] = { count: 1, timestamp: now };
    return true;
  }

  if (restartInfo.count >= MAX_RESTART_ATTEMPTS) {
    // Max attempts reached within time window
    return false;
  }

  // Increment restart counter
  restartInfo.count++;
  return true;
}
