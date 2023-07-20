import { readdir } from 'fs/promises';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { Engine_URL } from './internal/EngineClient';
import path from 'path';
import esbuild from 'esbuild';
import { getDirectories } from './utils';

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
    await importAndTranspile(fullWorkerFilePath);
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

async function importAndTranspile(fullWorkerFilePath: string) {
  const result = await esbuild.build({
    entryPoints: [fullWorkerFilePath],
    outfile: path.join(path.dirname(fullWorkerFilePath), 'dist', 'worker.js'),
    bundle: true,
    platform: 'node',
    target: 'node14',
    format: 'cjs',
  });

  if (result.errors.length > 0) {
    logger.error(`Could not transpile worker file '${fullWorkerFilePath}'`, {
      errors: result.errors,
    });
  }

  if (result.warnings.length > 0) {
    logger.warn(`Transpiled worker file '${fullWorkerFilePath}' with warnings`, {
      warnings: result.warnings,
    });
  }
}
