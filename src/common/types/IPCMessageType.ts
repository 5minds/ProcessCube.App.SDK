import { Identity } from '@5minds/processcube_engine_sdk';

export type IPCMessageType = {
  action: 'create' | 'restart',
  payload: {
    EngineURL: string,
    topic: string,
    identity: Identity,
    moduleString: string,
    pathToExternalTask: string
  }
} | {
  action: 'start' | 'createCompleted'
} | {
  action: 'updateIdentity',
  payload: {
    identity: Identity
  }
};
