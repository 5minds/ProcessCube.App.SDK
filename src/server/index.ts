import 'only-server';

export * from './lib';
export * from './server-actions';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROCESSCUBE_ENGINE_URL?: string;
    }
  }
}
