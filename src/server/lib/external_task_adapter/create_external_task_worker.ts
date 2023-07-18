import {
  ExternalTaskWorker,
  HandleExternalTaskAction,
  IExternalTaskWorkerConfig,
} from '@5minds/processcube_engine_client';
import { ExternalTask, Logger } from '@5minds/processcube_engine_sdk';
import * as AuthTokenProvider from './auth_token_provider';

const logger = new Logger('external_task_worker_playground');

let externalTaskWorker: ExternalTaskWorker<Record<string, unknown>, Record<string, unknown>>;
let interval = null;

export async function createExternalTaskWorker(
  url: string,
  topic: string,
  callback: HandleExternalTaskAction<Record<string, unknown>, Record<string, unknown>>
): Promise<ExternalTaskWorker<Record<string, unknown>, Record<string, unknown>>> {
  const identity = await AuthTokenProvider.getIdentity();
  startRefreshingIdentity();

  const config: IExternalTaskWorkerConfig = {
    lockDuration: 20000,
    maxTasks: 5,
    longpollingTimeout: 1000,
    identity: identity,
  };

  externalTaskWorker = new ExternalTaskWorker<Record<string, unknown>, Record<string, unknown>>(
    url,
    topic,
    callback,
    config
  );

  externalTaskWorker.onWorkerError((errorType: any, error: Error, externalTask?: ExternalTask<any>): void => {
    logger.error(`Intercepted "${errorType}"-type error: ${error.message}`, {
      err: error,
      type: errorType,
      externalTask: externalTask,
      workerId: externalTaskWorker.workerId,
    });
  });

  return externalTaskWorker;
}

function startRefreshingIdentity(): void {
  interval = setInterval(async (): Promise<void> => {
    //logger.info('Refreshing identity');
    const newIdentity = await AuthTokenProvider.getIdentity();

    externalTaskWorker.identity = newIdentity;
  }, 30000);
}
