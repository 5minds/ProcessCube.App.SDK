import type { EngineClient } from '@5minds/processcube_engine_client';

import { Client } from '../lib/internal/EngineClient';

export async function finishUserTask(
  ...args: Parameters<typeof EngineClient.prototype.userTasks.finishUserTask>
): ReturnType<typeof EngineClient.prototype.userTasks.finishUserTask> {
  await Client.userTasks.finishUserTask(...args);
}
