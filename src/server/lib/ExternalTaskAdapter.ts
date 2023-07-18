import { readdir } from 'fs/promises';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { IExternalTaskWorkerConfig, ExternalTaskWorker } from '@5minds/processcube_engine_client';
import { Engine_URL } from './internal/EngineClient';
import path from 'path';
import { getDirectories } from './utils';

const DEFAULT_EXTERNAL_TASK_WORKER_CONFIG: IExternalTaskWorkerConfig = {
  lockDuration: 20000,
  maxTasks: 5,
  longpollingTimeout: 1000,
};

const logger = new Logger('external_task_worker_playground');

export async function subscribeToExternalTasks(external_tasks_dir: string): Promise<ExternalTaskWorker<any, any>[]> {
  logger.info(`Subscribing to external tasks at ${external_tasks_dir}`);

  const allExternalTaskWorker = [];
  const directories = await getDirectories(external_tasks_dir);

  for (const directory of directories) {
    const files = await readdir(directory);
    const workerFile = files.find((file) => file.startsWith('worker') && file.endsWith('.ts'));

    if (!workerFile) {
      continue;
    }

    logger.info(`Found worker file in directory '${directory}'`);

    const fullWorkerFilePath = path.join(directory, workerFile);
    const module = await import(fullWorkerFilePath);

    const identity = await getIdentity();
    const lockDuration = (await module.lockDuration) ?? DEFAULT_EXTERNAL_TASK_WORKER_CONFIG.lockDuration;
    const maxTasks = (await module.maxTasks) ?? DEFAULT_EXTERNAL_TASK_WORKER_CONFIG.maxTasks;
    const longpollingTimeout =
      (await module.longpollingTimeout) ?? DEFAULT_EXTERNAL_TASK_WORKER_CONFIG.longpollingTimeout;

    logger.info(`Using lock duration of ${lockDuration}ms`);
    logger.info(`Using max tasks of ${maxTasks}`);
    logger.info(`Using longpolling timeout of ${longpollingTimeout}ms`);

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
