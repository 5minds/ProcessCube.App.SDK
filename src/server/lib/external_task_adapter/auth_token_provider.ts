import { Identity } from '@5minds/processcube_engine_sdk';

export async function getIdentity(): Promise<Identity> {
  return {
    token: 'ZHVtbXlfdG9rZW4=',
    userId: 'dummy_token',
  };
}
