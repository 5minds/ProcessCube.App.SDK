import { pid } from 'node:process';

import { ExternalTaskWorker, IExternalTaskWorkerConfig } from '@5minds/processcube_engine_client';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';

import type { IPCMessageType, StartPayload } from '../../common';

const logger = new Logger('processcube_app_sdk:external_task_worker_process');
const EngineURL = process.env.PROCESSCUBE_ENGINE_URL ?? null;

let externalTaskWorker: ExternalTaskWorker<unknown, any> | null = null;
let workerTopic: string;

// Reconnect state
let connectionRetryCount = 0;
let isReconnecting = false;
const DEFAULT_MAX_CONNECTION_RETRIES = 6;
const MAX_CONNECTION_RETRIES = parseInt(process.env.PROCESSCUBE_APP_SDK_ETW_RETRY ?? '', 10) || DEFAULT_MAX_CONNECTION_RETRIES;
const MAX_BACKOFF_MS = 30_000;

let currentIdentity: Identity;
let currentModuleString: string;
let currentWorkerPath: string;

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as any).code;
  return (
    ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(code) || error.message?.includes('socket hang up') || error.message?.includes('fetch failed')
  );
}

process.on('message', (message: IPCMessageType) => {
  (async () => {
    try {
      switch (message.action) {
        case 'create':
          await create(message.payload);
          break;
        case 'restart':
          await restart(message.payload);
          break;
        case 'updateIdentity':
          updateIdentity(message.payload);
          break;
      }
    } catch (error) {
      logger.error('Error handling IPC message', {
        action: message.action,
        error,
        pid,
      });
    }
  })();
});

process.once('SIGTERM', () => {
  quit('External Task Worker Process received SIGTERM signal');
});

process.once('SIGINT', () => {
  quit('External Task Worker Process received SIGINT signal');
});

process.once('SIGHUP', () => {
  quit('External Task Worker Process received SIGHUP signal');
});

process.once('disconnect', () => {
  quit('External Task Worker Process received disconnect signal');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection in External Task Worker Process', {
    reason,
    pid,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in External Task Worker Process', {
    error,
    pid,
  });
  process.exit(4);
});

async function create({
  topic,
  identity,
  moduleString,
  workerPath,
  workerId,
}: StartPayload & {
  workerId?: string;
}) {
  workerTopic = topic;
  currentIdentity = identity;
  currentModuleString = moduleString;
  currentWorkerPath = workerPath;

  const module = await requireFromString(moduleString, workerPath);
  if (module === null) {
    process.exit(1);
  }
  if (!('default' in module)) {
    logger.error(
      `Failed starting external task worker ${externalTaskWorker?.workerId ?? ''} for topic ${topic}. Please export a default handler function. For more information see https://processcube.io/docs/app-sdk/samples/nextjs/external-task-adapter-with-nextjs#external-tasks-entwickeln`,
      {
        workerId: externalTaskWorker?.workerId,
        topic,
        pid,
      },
    );
    process.exit(2);
  }
  const config: IExternalTaskWorkerConfig = {
    identity,
    ...module?.config,
    workerId,
  };
  const handler = module.default;
  assertNotNull(EngineURL, 'EngineURL');
  externalTaskWorker = new ExternalTaskWorker<unknown, any>(EngineURL, topic, handler, config);
  externalTaskWorker.onWorkerError((errorType, error, externalTask) => {
    assertNotNull(externalTaskWorker, 'externalTaskWorker');
    logger.error(`External task worker ${externalTaskWorker.workerId} for topic ${topic} ran into an error`, {
      errorType,
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
              ...((error as any).code && { code: (error as any).code }),
            }
          : error,
      externalTaskId: externalTask?.id,
      workerId: externalTaskWorker.workerId,
      topic,
      pid,
    });
    externalTaskWorker.stop();
    externalTaskWorker.dispose();
    externalTaskWorker = null;

    scheduleReconnectOrExit(error, topic);
  });

  try {
    externalTaskWorker.start();
  } catch (error) {
    logger.error(`Failed to start external task worker for topic ${topic}`, { error, pid });
    externalTaskWorker.stop();
    externalTaskWorker.dispose();
    externalTaskWorker = null;
    scheduleReconnectOrExit(error, topic);
    return;
  }

  if (!isReconnecting) {
    connectionRetryCount = 0;
  }
  isReconnecting = false;
  logger.info(`Started external task worker ${externalTaskWorker.workerId} for topic ${topic}`, {
    workerId: externalTaskWorker.workerId,
    topic,
    pid,
  });
}

function scheduleReconnectOrExit(error: unknown, topic: string) {
  if (isConnectionError(error) && connectionRetryCount < MAX_CONNECTION_RETRIES) {
    connectionRetryCount++;
    isReconnecting = true;
    const delay = Math.min(1000 * Math.pow(2, connectionRetryCount - 1), MAX_BACKOFF_MS);
    logger.info(`Connection error for topic ${topic}, retrying in ${delay}ms (attempt ${connectionRetryCount}/${MAX_CONNECTION_RETRIES})`, {
      topic,
      pid,
      delay,
      attempt: connectionRetryCount,
    });
    setTimeout(() => {
      create({ topic, identity: currentIdentity, moduleString: currentModuleString, workerPath: currentWorkerPath });
    }, delay);
    return;
  }

  process.exit(3);
}

async function restart({ topic, identity, moduleString, workerPath }: StartPayload) {
  const workerId = externalTaskWorker?.workerId;

  logger.info(`Restarting external task worker ${workerId ?? ''} for topic ${topic}`, {
    reason: `Code changes in External Task for ${topic}`,
    workerId,
    topic,
    pid,
  });

  shutdownExternalTaskWorker('External Task Worker restarting');
  await create({
    topic,
    identity,
    moduleString,
    workerPath,
    workerId,
  });
}

function updateIdentity({ identity }: { identity: Identity }) {
  if (externalTaskWorker) {
    externalTaskWorker.identity = identity;
  }
}

function quit(reason: string) {
  shutdownExternalTaskWorker(reason);
  process.exit();
}

function shutdownExternalTaskWorker(reason: string) {
  logger.info(`Stopping external task worker ${externalTaskWorker?.workerId ?? ''} for topic ${workerTopic}`, {
    reason,
    workerId: externalTaskWorker?.workerId,
    topic: workerTopic,
    pid,
  });

  externalTaskWorker?.stop();
  externalTaskWorker?.dispose();
}

function requireFromString(src: string, filename: string) {
  try {
    var Module = module.constructor as any;
    var m = new Module();
    m._compile(src, filename);

    return m.exports;
  } catch (error) {
    logger.error(`Could not start external task worker due to error while requiring module from string`, {
      err: error,
      pid,
    });
    return null;
  }
}

function assertNotNull<T = any>(value: T, nameForErrorMessage: string, context?: any): asserts value is NonNullable<T> {
  if (value == null) {
    const suffix = context == null ? '' : `\n\nContext:\n\n${JSON.stringify(context, null, 2)}`;
    throw new Error(`Unexpected value: \`${nameForErrorMessage}\` should not be null here.${suffix}`);
  }
}
