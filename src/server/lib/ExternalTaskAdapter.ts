import { readdir } from 'fs/promises';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { Engine_URL } from './internal/EngineClient';
import path from 'path';
import esbuild from 'esbuild';
import { promises as fs, PathLike } from 'fs';
import { Issuer } from 'openid-client';
import jwtDecode from 'jwt-decode';

const DEFAULT_EXTERNAL_TASK_WORKER_CONFIG: IExternalTaskWorkerConfig = {
  lockDuration: 20000,
  maxTasks: 5,
  longpollingTimeout: 1000,
};

const logger = new Logger('external_task_worker_playground');

export async function subscribeToExternalTasks(external_tasks_dir: string): Promise<ExternalTaskWorker<any, any>[]> {
  const allExternalTaskWorker = [];
  const directories = await getDirectories(external_tasks_dir);

  for (const directory of directories) {
    const files = await readdir(directory);
    const workerFile = files.find((file) => file.startsWith('worker') && file.endsWith('.ts'));

    if (!workerFile) {
      continue;
    }

    const fullWorkerFilePath = path.join(directory, workerFile);
    await transpileTypescriptFile(fullWorkerFilePath);
    const pathToModule = path.join(directory, 'dist', 'worker.js');

    // TODO: find a better way to import the module?
    let module = await import(pathToModule);
    logger.info(`module.default.default: ${module.default.default}`);
    if (module.default.default) {
      module = module.default;
    }

    const identity = await getIdentity();
    const lockDuration = (await module.lockDuration) ?? DEFAULT_EXTERNAL_TASK_WORKER_CONFIG.lockDuration;
    const maxTasks = (await module.maxTasks) ?? DEFAULT_EXTERNAL_TASK_WORKER_CONFIG.maxTasks;
    const longpollingTimeout =
      (await module.longpollingTimeout) ?? DEFAULT_EXTERNAL_TASK_WORKER_CONFIG.longpollingTimeout;

    const topic = path.basename(directory);
    const handler = module.default;

    const config: IExternalTaskWorkerConfig = {
      lockDuration: lockDuration,
      maxTasks: maxTasks,
      longpollingTimeout: longpollingTimeout,
      identity: identity,
    };

    const externalTaskWorker = new ExternalTaskWorker<any, any>(Engine_URL, topic, handler, config);
    const interval = await startRefreshingIdentity(externalTaskWorker);

    // TODO remove log
    logger.info(`Starting external task worker ${externalTaskWorker.workerId} for topic '${topic}'`);

    externalTaskWorker.onWorkerError((errorType, error, externalTask): void => {
      logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
        err: error,
        type: errorType,
        externalTask: externalTask,
        workerId: externalTaskWorker.workerId,
      });
      clearInterval(interval);
    });

    externalTaskWorker.start();
    allExternalTaskWorker.push(externalTaskWorker);
  }

  return allExternalTaskWorker;
}

// TODO refresh identity in regular intervals
// TODO replace with real identity provider
async function getIdentity(): Promise<Identity> {
  try {
    logger.info('Discovering issuer...');
    const issuer = await Issuer.discover('http://authority:11560/');
    logger.info('Issuer discovered:', { issuer: issuer.issuer });

    let client;
    try {
      logger.info('Creating client...');
      client = new issuer.Client({
        client_id: 'test_etw',
        client_secret: 'abc',
      });
      logger.info('Client created:', { client });
    } catch (error) {
      logger.error('Could not create client:', { error });
      throw error;
    }

    let tokenSet;
    try {
      logger.info('Requesting token set...');
      tokenSet = await client!.grant({
        grant_type: 'client_credentials',
        scope: 'engine_etw',
      });
      logger.info('Token set received:', { tokenSet });
    } catch (error) {
      logger.error('Could not get token set:', { error });
      throw error;
    }

    logger.info(`${tokenSet!.expires_in} seconds until token expires`);
    const accessToken = tokenSet!.access_token as string;
    const decodedToken = jwtDecode<Record<string, unknown>>(accessToken);
    logger.info('Decoded token from accessToken:', { decodedToken });

    return {
      token: tokenSet!.access_token as string,
      userId: decodedToken.sub as string,
    };
  } catch (error) {
    // Add a catch block at the highest level to log unexpected errors
    logger.error('Unexpected error occurred:', { error });
    throw error;
  }
}

/**
 * Get the time in seconds until the current access token expires.
 * @returns {Promise<number>} A promise that resolves with the time in seconds until the current access token expires
 * */
async function getExpiresIn(): Promise<number> {
  try {
    logger.info('Discovering issuer...');
    const issuer = await Issuer.discover('http://authority:11560/');
    logger.info('Issuer discovered:', { issuer: issuer.issuer });

    let client;
    try {
      logger.info('Creating client...');
      client = new issuer.Client({
        client_id: 'test_etw',
        client_secret: 'abc',
      });
      logger.info('Client created:', { client });
    } catch (error) {
      logger.error('Could not create client:', { error });
      throw error;
    }

    let tokenSet;
    try {
      logger.info('Requesting token set...');
      tokenSet = await client!.grant({
        grant_type: 'client_credentials',
        scope: 'engine_etw',
      });
      logger.info('Token set received:', { tokenSet });
    } catch (error) {
      logger.error('Could not get token set:', { error });
      throw error;
    }

    logger.info(`${tokenSet!.expires_in} seconds until token expires`);
    return tokenSet!.expires_in as number;
  } catch (error) {
    // Add a catch block at the highest level to log unexpected errors
    logger.error('Unexpected error occurred:', { error });
    throw error;
  }
}

/**
 * Start refreshing the identity in regular intervals.
 * @param {ExternalTaskWorker<any, any>} externalTaskWorker The external task worker to refresh the identity for
 * @returns {Promise<NodeJS.Timeout>} A promise that resolves with the interval that is refreshing the identity
 * */
async function startRefreshingIdentity(externalTaskWorker: ExternalTaskWorker<any, any>): Promise<NodeJS.Timeout> {
  const expires_in = await getExpiresIn();
  const delay = expires_in * 0.85 * 1000;
  logger.info(`Refreshing identity in ${delay}ms`);
  const interval = setInterval(async (): Promise<void> => {
    logger.info('Refreshing identity');
    const newIdentity = await getIdentity();

    externalTaskWorker.identity = newIdentity;
  }, delay);

  return interval;
}

/**
 * Transpile a typescript file to javascript.
 * @param {string} entryPoint The path to the typescript file
 * @param {string} outdir The directory to put the transpiled file in
 * @returns {Promise<void>} A promise that resolves when the file is transpiled
 * */
async function transpileTypescriptFile(entryPoint: string, outdir?: string): Promise<void> {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    outdir: outdir ?? path.join(path.dirname(entryPoint), 'dist'),
    bundle: true,
    platform: 'node',
    target: 'node14',
    format: 'esm',
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
  const dirents = await fs.readdir(source, { withFileTypes: true });
  const directories = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = path.join(source.toString(), dirent.name);

      return dirent.isDirectory() ? [fullPath, ...(await getDirectories(fullPath))] : [];
    })
  );

  return Array.prototype.concat(...directories);
}
