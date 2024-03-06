import 'only-server';

import '../common';

export * from './lib';
export * from './plugin';
export * from './server-actions';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROCESSCUBE_ENGINE_URL?: string;
      PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_ID?: string;
      PROCESSCUBE_EXTERNAL_TASK_WORKER_CLIENT_SECRET?: string;
      PROCESSCUBE_AUTHORITY_URL?: string;
    }
  }
}
