import { Identity } from '@5minds/processcube_engine_sdk';

export type StartPayload = {
  identity: Identity | boolean;
  moduleString: string;
  topic: string;
  workerPath: string;
};

export type IPCMessageType =
  | {
      action: 'create' | 'restart';
      payload: StartPayload;
    }
  | {
      action: 'updateIdentity';
      payload: {
        identity: Identity;
      };
    };
