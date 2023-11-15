import { Identity, Logger } from '@5minds/processcube_engine_sdk';
import { ExternalTaskWorker, IExternalTaskWorkerConfig } from '@5minds/processcube_engine_client';

const logger = new Logger('processcube_app_sdk:external_task_worker_worker');

let externalTaskWorker: ExternalTaskWorker<any, any>;

process.on('message', async (message: { action: string; payload: any }) => {
  switch (message.action) {
    case 'create':
      await create(message.payload);
      break;
    case 'restart':
      restart(message.payload);
      break;
    case 'start':
      start(message.payload);
      break;
    case 'updateIdentity':
      updateIdentity(message.payload);
      break;
  }
});

process.on('SIGTERM', () => {
  logger.info(`Stopping external task ${externalTaskWorker.workerId} for topic TODO TOPIC`, {
    reason: `External Task for TODO TOPIC was removed`,
    workerId: externalTaskWorker.workerId,
    // topic: topic,
  });

  shutdownExternalTaskWorker();
  process.exit(0);
});

async function create({
  EngineURL,
  topic,
  identity,
  moduleString,
  fullWorkerFilePath,
  workerId,
}: {
  EngineURL: string;
  topic: string;
  identity: Identity;
  moduleString: string;
  fullWorkerFilePath: string;
  workerId?: string;
}) {
  const module = await requireFromString(moduleString, fullWorkerFilePath);
  const config: IExternalTaskWorkerConfig = {
    identity,
    ...module?.config,
    workerId,
  };
  const handler = module.default;
  externalTaskWorker = new ExternalTaskWorker<any, any>(EngineURL, topic, handler, config);
  process.send?.({
    action: 'createCompleted',
  });
}

function restart({
  EngineURL,
  topic,
  identity,
  moduleString,
  fullWorkerFilePath,
}: {
  EngineURL: string;
  topic: string;
  identity: Identity;
  moduleString: string;
  fullWorkerFilePath: string;
}) {
  const workerId = externalTaskWorker.workerId;

  logger.info(`Restarting external task ${externalTaskWorker.workerId} for topic ${topic}`, {
    reason: `Code changes in External Task for ${topic}`,
    workerId: externalTaskWorker.workerId,
    topic: topic,
  });

  shutdownExternalTaskWorker();
  create({
    EngineURL,
    topic,
    identity,
    moduleString,
    fullWorkerFilePath,
    workerId,
  });
}

function start({ topic }: { topic: string }) {
  externalTaskWorker.start();
  logger.info(`Started external task ${externalTaskWorker.workerId} for topic ${topic}`);
}

function updateIdentity(identity: Identity) {
  externalTaskWorker.identity = identity;
}

function shutdownExternalTaskWorker() {
  externalTaskWorker.stop();
  externalTaskWorker.dispose();
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
    logger.error(`Could not require module from string`, {
      err: error,
    });

    throw error;
  }
}
