import { readdir } from 'fs/promises';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { Engine_URL } from './internal/EngineClient';
import path from 'path';
import esbuild from 'esbuild';
import { promises as fs, PathLike } from 'fs';

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

    // TODO remove log
    logger.info(`Starting external task worker ${externalTaskWorker.workerId} for topic '${topic}'`);

    externalTaskWorker.onWorkerError((errorType, error, externalTask): void => {
      logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
        err: error,
        type: errorType,
        externalTask: externalTask,
        workerId: externalTaskWorker.workerId,
      });
    });

    externalTaskWorker.start();
    allExternalTaskWorker.push(externalTaskWorker);
  }

  return allExternalTaskWorker;
}

// TODO refresh identity in regular intervals
// TODO replace with real identity provider
async function getIdentity(): Promise<Identity> {
  return {
    token: 'ZHVtbXlfdG9rZW4=',
    userId: 'dummy_token',
  };
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
  const dirents = await fs.readdir(source, { withFileTypes: true });
  const directories = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = path.join(source.toString(), dirent.name);

      return dirent.isDirectory() ? [fullPath, ...(await getDirectories(fullPath))] : [];
    })
  );

  return Array.prototype.concat(...directories);
}
