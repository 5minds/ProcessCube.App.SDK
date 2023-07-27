import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { EngineURL } from './internal/EngineClient';
import { join, basename } from 'node:path';
import { build as esBuild } from 'esbuild';
import { promises as fsp, PathLike, existsSync } from 'node:fs';
import { Issuer } from 'openid-client';
import jwtDecode from 'jwt-decode';

const DUMMY_IDENTITY: Identity = {
  token: 'ZHVtbXlfdG9rZW4=',
  userId: 'dummy_token',
};

const DELAY_FACTOR = 0.85;

const logger = new Logger('processcube_app_sdk:external_task_adapter');
const authorityIsConfigured = process.env.PROCESSCUBE_AUTHORITY_URL !== undefined;

export async function subscribeToExternalTasks(externalTasksDirPath: string): Promise<void> {
  const directories = await getDirectories(externalTasksDirPath);
  const outDir = join(externalTasksDirPath, 'dist');
  if (!existsSync(outDir)) {
    await fsp.mkdir(outDir);
  }

  for (const directory of directories) {
    const workerFile = await getWorkerFile(directory);

    if (!workerFile) {
      continue;
    }

    const fullWorkerFilePath = join(directory, workerFile);
    const topic = basename(directory);
    const outFilePath = join(outDir, `${topic}_worker.js`);
    await transpileTypescriptFile(fullWorkerFilePath, outFilePath);

    let module = await import(outFilePath);
    if (module.default.default) {
      module = module.default;
    }

    // TODO add all configs
    const config: IExternalTaskWorkerConfig = {
      identity: await getIdentityForExternalTaskWorkers(),
      lockDuration: module.lockDuration,
      longpollingTimeout: module.longpollingTimeout,
      maxTasks: module.maxTasks,
    };

    const handler = module.default;
    const externalTaskWorker = new ExternalTaskWorker<any, any>(EngineURL, topic, handler, config);
    const interval = await startRefreshingIdentity(externalTaskWorker);

    logger.info(`Starting external task worker ${externalTaskWorker.workerId} for topic '${topic}'`);

    externalTaskWorker.onWorkerError((errorType, error, externalTask): void => {
      logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
        err: error,
        type: errorType,
        externalTask: externalTask,
        workerId: externalTaskWorker.workerId,
      });
      clearInterval(interval);
      throw error;
    });

    externalTaskWorker.start();
  }

  await fsp.rm(outDir, { recursive: true });
}

async function getWorkerFile(directory: string): Promise<string | null> {
  const files = await fsp.readdir(directory);
  const workerFiles = files.filter((file) => file.startsWith('worker') && file.endsWith('.ts'));

  if (workerFiles.length === 0) {
    return null;
  }

  if (workerFiles.length > 1) {
    throw new Error(`Found more than one worker file in directory '${directory}'`);
  }

  return workerFiles[0];
}

async function getIdentityForExternalTaskWorkers(): Promise<Identity> {
  if (!authorityIsConfigured) {
    return DUMMY_IDENTITY;
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

  const accessToken = tokenSet.access_token as string;
  const decodedToken = jwtDecode<Record<string, unknown>>(accessToken);

  return {
    token: tokenSet.access_token as string,
    userId: decodedToken.sub as string,
  };
}

/**
 * Start refreshing the identity in regular intervals.
 * @param {ExternalTaskWorker<any, any>} externalTaskWorker The external task worker to refresh the identity for
 * @returns {Promise<NodeJS.Timeout | undefined>} A promise that resolves with the interval that refreshes the identity or undefined if no authority is configured
 * */
async function startRefreshingIdentity(
  externalTaskWorker: ExternalTaskWorker<any, any>
): Promise<NodeJS.Timeout | undefined> {
  if (!authorityIsConfigured) {
    return;
  }

  const expiresIn = await getExpiresInForExternalTaskWorkers();
  const delay = expiresIn * DELAY_FACTOR * 1000;
  const interval = setInterval(async (): Promise<void> => {
    const newIdentity = await getIdentityForExternalTaskWorkers();
    externalTaskWorker.identity = newIdentity;
  }, delay);

  return interval;
}

/**
 * Transpile a typescript file to javascript.
 * @param {string} entryPoint The path to the typescript file
 * @param {string} outFile The path to the transpiled javascript file
 * @returns {Promise<void>} A promise that resolves when the file is transpiled
 * */
async function transpileTypescriptFile(entryPoint: string, outFile: string): Promise<void> {
  const result = await esBuild({
    entryPoints: [entryPoint],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
  });

  if (result.errors.length > 0) {
    logger.error(`Could not transpile file at '${entryPoint}'`, {
      errors: result.errors,
    });
  }

  if (result.warnings.length > 0) {
    logger.warn(`Transpiled file at '${entryPoint}' with warnings`, {
      warnings: result.warnings,
    });
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
    })
  );

  return Array.prototype.concat(...directories);
}

/**
 * Get the time in seconds until the current access token expires.
 * @returns {Promise<number>} A promise that resolves with the time in seconds until the current access token expires
 * */
async function getExpiresInForExternalTaskWorkers(): Promise<number> {
  const issuer = await Issuer.discover(process.env.PROCESSCUBE_AUTHORITY_URL as string);
  const client = new issuer.Client({
    client_id: process.env.EXTERNAL_TASK_WORKER_CLIENT_ID as string,
    client_secret: process.env.EXTERNAL_TASK_WORKER_CLIENT_SECRET as string,
  });

  const tokenSet = await client.grant({
    grant_type: 'client_credentials',
    scope: 'engine_etw',
  });

  return tokenSet.expires_in as number;
}
