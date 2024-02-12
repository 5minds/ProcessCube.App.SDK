import 'only-server';

export * from './lib';
export * from './plugin';
export * from './server-actions';

// TODO placeholder. some import from common is required, because the declared modules would otherwise not get imported in the server package. as soon as a feature imports something from common inside server, this can be removed.
import { hasClaim } from '@app_sdk_internal/common';

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
