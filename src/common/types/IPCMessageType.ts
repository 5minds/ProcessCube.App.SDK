import { Identity } from '@5minds/processcube_engine_sdk';

export type CreateRestartPayload = {
  identity: Identity;
  moduleString: string;
  topic: string;
  workerPath: string;
};

export type IPCMessageType =
  | {
      action: 'create' | 'restart';
      payload: CreateRestartPayload;
    }
  | {
      action: 'updateIdentity';
      payload: {
        identity: Identity;
      };
    };
