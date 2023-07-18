import * as fs from 'fs';
import { Logger } from '@5minds/processcube_engine_sdk';
import start_external_task from './runner';

const logger = new Logger('external_task_worker_playground');

export async function subscribeToExternalTasks(dir: string): Promise<number> {
  logger.info(`Subscribing to external tasks at ${dir}`);

  let count_handlers = 0;

  const files = await fs.promises.readdir(dir);

  for (const file of files) {
    const handler_filename = `${dir}/${file}`;
    await start_external_task(file, handler_filename);
    count_handlers = count_handlers + 1;
  }

  return count_handlers;
}
