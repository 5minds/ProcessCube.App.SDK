import type { EngineClient } from '@5minds/processcube_engine_client';

import { Client } from '../lib/internal/EngineClient';

export async function finishManualTask(
  ...args: Parameters<typeof EngineClient.prototype.manualTasks.finishManualTask>
): ReturnType<typeof EngineClient.prototype.manualTasks.finishManualTask> {
  await Client.manualTasks.finishManualTask(...args);
}
