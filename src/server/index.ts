import 'only-server';

export * from './lib';
export * from './plugin';
export * from './server-actions';

import { hasClaim } from '../common';

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

hasClaim('test');
