import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig } from '@5minds/processcube_engine_client';
import { build as esBuild } from 'esbuild';
import { join, relative } from 'node:path';
import { ChildProcess, fork } from 'node:child_process';
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
    const topic = relative(externalTasksDirPath, directory)
      .replace(/^\.\/+|\([^)]+\)|^\/*|\/*$/g, '')
      .replace(/[\/]{2,}/g, '/');

    let externalTaskWorkerProcess = await startExternalTaskWorker(fullWorkerFilePath, topic);

    watch(fullWorkerFilePath)
      .on('change', async () => {
        // logger.info(`Restarting external task ${externalTaskWorker.workerId} for topic ${topic}`, {
        //   reason: `Code changes in External Task for ${topic}`,
        //   workerId: externalTaskWorker.workerId,
        //   topic: topic,
        // });
        // TODO: Restart external task worker with same workerId
        // externalTaskWorker = await startExternalTaskWorker(fullWorkerFilePath, topic, externalTaskWorker.workerId);
        restartExternalTaskWorker(externalTaskWorkerProcess, fullWorkerFilePath, topic);
      })
      .on('unlink', async () => {
        externalTaskWorkerProcess.kill();
      })
      .on('add', async () => {
        // if (!externalTaskWorker.pollingIsActive) {
        //   logger.info(`Starting external task ${externalTaskWorker.workerId} for topic ${topic}`, {
        //     reason: `External Task for ${topic} was added`,
        //     workerId: externalTaskWorker.workerId,
        //     topic: topic,
        //   });
        //   externalTaskWorker = await startExternalTaskWorker(fullWorkerFilePath, topic, externalTaskWorker.workerId);
        // }
        //TODO start external task worker
      })
      .on('error', (error) => logger.info(`Watcher error: ${error}`));
  }
}

async function startExternalTaskWorker(fullWorkerFilePath: string, topic: string): Promise<ChildProcess> {
  const workerFile = join(__dirname, 'lib/ExternalTaskWorkerProcess.cjs');
  const externalTaskWorkerProcess = fork(workerFile);

  const tokenSet = authorityIsConfigured ? await getFreshTokenSet() : null;
  const identity = await getIdentityForExternalTaskWorkers(tokenSet);

  externalTaskWorkerProcess.on('message', async (message: { action: string }) => {
    switch (message.action) {
      case 'createCompleted':
        await startRefreshingIdentityCycle(tokenSet, externalTaskWorkerProcess);
        externalTaskWorkerProcess.send({
          action: 'start',
          payload: {
            topic,
          },
        });
        break;
    }
  });

  const moduleString = await getModuleStringFromTypescriptFile(fullWorkerFilePath);

  externalTaskWorkerProcess.send({
    action: 'create',
    payload: {
      EngineURL,
      topic,
      identity,
      moduleString,
      fullWorkerFilePath,
    },
  });

  return externalTaskWorkerProcess;
}

async function restartExternalTaskWorker(
  externalTaskWorkerProcess: ChildProcess,
  fullWorkerFilePath: string,
  topic: string,
): Promise<void> {
  const tokenSet = authorityIsConfigured ? await getFreshTokenSet() : null;
  const identity = await getIdentityForExternalTaskWorkers(tokenSet);
  const moduleString = await getModuleStringFromTypescriptFile(fullWorkerFilePath);

  externalTaskWorkerProcess.send({
    action: 'restart',
    payload: {
      EngineURL,
      topic,
      identity,
      moduleString,
      fullWorkerFilePath,
    },
  });
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
  externalTaskWorkerProcess: ChildProcess,
  retries: number = 5,
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
      externalTaskWorkerProcess.send({
        action: 'updateIdentity',
        payload: {
          identity: newIdentity,
        },
      });
      await startRefreshingIdentityCycle(newTokenSet, externalTaskWorkerProcess);
    }, delay);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    logger.error(`Could not refresh identity for external task worker worker ${externalTaskWorkerProcess.pid}`, {
      err: error,
      retriesLeft: retries,
    });

    const delay = 2 * 1000;
    setTimeout(async () => await startRefreshingIdentityCycle(tokenSet, externalTaskWorkerProcess, retries - 1), delay);
  }
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
    }),
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
    throw new Error('Could not determine the time until the access token for external task workers expires');
  }

  return expiresIn;
}

/**
 * Get the module string of a typescript file.
 * @param {string} entryPoint The path to the typescript file
 * @returns {Promise<string>} A promise that resolves with the module string of the transpiled file
 * */
async function getModuleStringFromTypescriptFile(entryPoint: string): Promise<string> {
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

  const moduleString = result.outputFiles[0].text;

  return moduleString;
}
