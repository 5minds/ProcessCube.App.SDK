import { pid } from 'node:process';

import { ExternalTaskWorker, IExternalTaskWorkerConfig } from '@5minds/processcube_engine_client';
import { Identity, Logger } from '@5minds/processcube_engine_sdk';

import { type IPCMessageType } from '../../common';

const logger = new Logger('processcube_app_sdk:external_task_worker_process');

let externalTaskWorker: ExternalTaskWorker<any, any> | null = null;
let workerTopic: string;

process.on('message', async (message: IPCMessageType) => {
  switch (message.action) {
    case 'create':
      await create(message.payload);
      break;
    case 'restart':
      restart(message.payload);
      break;
    case 'start':
      start();
      break;
    case 'updateIdentity':
      updateIdentity(message.payload);
      break;
  }
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

async function create({
  EngineURL,
  topic,
  identity,
  moduleString,
  pathToExternalTask,
  workerId,
}: {
  EngineURL: string;
  topic: string;
  identity: Identity;
  moduleString: string;
  pathToExternalTask: string;
  workerId?: string;
}) {
  workerTopic = topic;
  const module = await requireFromString(moduleString, pathToExternalTask);
  if (module === null) {
    return;
  }
  if (!('default' in module)) {
    logger.info(
      `Failed starting external task worker ${externalTaskWorker?.workerId ?? ''} for topic ${topic}. No default export found in module`,
      {
        workerId: externalTaskWorker?.workerId,
        topic,
        pid,
      },
    );
    return;
  }
  const config: IExternalTaskWorkerConfig = {
    identity,
    ...module?.config,
    workerId,
  };
  const handler = module.default;
  externalTaskWorker = new ExternalTaskWorker<any, any>(EngineURL, topic, handler, config);
  externalTaskWorker.onWorkerError((error) => {
    assertNotNull(externalTaskWorker, 'externalTaskWorker');
    logger.error(`External task worker ${externalTaskWorker.workerId} for topic ${topic} ran into an error`, {
      error,
      workerId: externalTaskWorker.workerId,
      topic,
      pid,
    });
  });

  assertNotNull(process.send, 'process.send');

  process.send({
    action: 'createCompleted',
  } satisfies IPCMessageType);
}

function restart({
  EngineURL,
  topic,
  identity,
  moduleString,
  pathToExternalTask,
}: {
  EngineURL: string;
  topic: string;
  identity: Identity;
  moduleString: string;
  pathToExternalTask: string;
}) {
  const workerId = externalTaskWorker?.workerId;

  logger.info(`Restarting external task worker ${workerId ?? ''} for topic ${topic}`, {
    reason: `Code changes in External Task for ${topic}`,
    workerId,
    topic,
    pid,
  });

  shutdownExternalTaskWorker('External Task Worker restarting');
  create({
    EngineURL,
    topic,
    identity,
    moduleString,
    pathToExternalTask,
    workerId,
  });
}

function start() {
  assertNotNull(externalTaskWorker, 'externalTaskWorker');
  externalTaskWorker.start();
  logger.info(`Started external task worker ${externalTaskWorker.workerId} for topic ${workerTopic}`, {
    workerId: externalTaskWorker.workerId,
    topic: workerTopic,
    pid,
  });
}

function updateIdentity({ identity }: { identity: Identity }) {
  if (externalTaskWorker) {
    externalTaskWorker.identity = identity;
  }
}

function quit(reason: string, code = 0) {
  shutdownExternalTaskWorker(reason);
  process.exit(code);
}

function shutdownExternalTaskWorker(reason: string) {
  logger.info(`Stopping external task worker ${externalTaskWorker?.workerId ?? ''} for topic ${workerTopic}`, {
    reason: reason,
    workerId: externalTaskWorker?.workerId,
    topic: workerTopic,
    pid,
  });
  externalTaskWorker?.stop();
  externalTaskWorker?.dispose();
}

/**
 * Require a module from a string.
 * @param {string} src The source code of the module
 * @param {string} filename The filename of the module
 * @returns The module exports of the module
 * */
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

/**
 * Used for those situations where you *know* that a value cannot possibly be `null`.
 *
 * But you want/need to check at runtime to fail early and produce a clear error message.
 */
function assertNotNull<T = any>(value: T, nameForErrorMessage: string, context?: any): asserts value is NonNullable<T> {
  if (value == null) {
    const suffix = context == null ? '' : `\n\nContext:\n\n${JSON.stringify(context, null, 2)}`;
    throw new Error(`Unexpected value: \`${nameForErrorMessage}\` should not be null here.${suffix}`);
  }
}
