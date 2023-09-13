import { type EngineClient } from '@5minds/processcube_engine_client';

import { Client } from './internal/EngineClient';

export function getEngineClient(): EngineClient {
  return Client;
}
