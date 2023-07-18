import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@5minds/processcube_engine_sdk';
import start_external_task from './runner';

const logger = new Logger('external_task_worker_playground');

export async function subscribeToExternalTasks(filepattern: string): Promise<number> {
  logger.info(`Subscribing to external tasks at ${filepattern}`);

  const normalizedPath = path.join(__dirname, '..', filepattern);

  let count_handlers = 0;

  fs.readdirSync(normalizedPath).forEach(async function (file: string) {
    const handler_filename = './../' + filepattern + '/' + file;

    await start_external_task(file, handler_filename);

    count_handlers = count_handlers + 1;
  });

  return count_handlers;
}
