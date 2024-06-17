import type { EngineClient } from '@5minds/processcube_engine_client';

import { Client } from '../lib/internal/EngineClient';

export async function finishUntypedTask(
  ...args: Parameters<typeof EngineClient.prototype.untypedTasks.finishTask>
): ReturnType<typeof EngineClient.prototype.untypedTasks.finishTask> {
  await Client.untypedTasks.finishTask(...args);
}
