import type { EngineClient } from '@5minds/processcube_engine_client';

import { Client } from '../lib/internal/EngineClient';

export async function startProcess(
  ...args: Parameters<typeof EngineClient.prototype.processModels.startProcessInstance>
): ReturnType<typeof EngineClient.prototype.processModels.startProcessInstance> {
  return await Client.processModels.startProcessInstance(...args);
}
