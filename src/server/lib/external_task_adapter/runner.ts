import { Logger } from '@5minds/processcube_engine_sdk';
import { createExternalTaskWorker } from './create_external_task_worker';

const logger = new Logger('external_task_worker_playground');

const engineUrl = process.env.PROCESSCUBE_ENGINE_URL ?? 'http://localhost:10560';

export default async function start_external_task(file: string, handler_filename: string) {
  const { handler } = require(handler_filename);

  const topic = file.replace(/\.js|\.ts/g, '');

  logger.info(`Subscribing to external task at ${engineUrl} task '${handler.name}' for topic '${topic}`);

  const externalTaskWorker = await createExternalTaskWorker(engineUrl, topic, handler);

  externalTaskWorker.start();
}
