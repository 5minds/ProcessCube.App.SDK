import type { DataModels, EngineClient } from '@5minds/processcube_engine_client';
import { Client } from '../lib/internal/EngineClient';

export async function startProcess(
  ...args: Parameters<typeof EngineClient.prototype.processModels.startProcessInstance>
): ReturnType<typeof EngineClient.prototype.processModels.startProcessInstance> {
  return await Client.processModels.startProcessInstance(...args);
}

export async function finishUserTask(
  ...args: Parameters<typeof EngineClient.prototype.userTasks.finishUserTask>
): ReturnType<typeof EngineClient.prototype.userTasks.finishUserTask> {
  await Client.userTasks.finishUserTask(...args);
}

// for test purposes - should be removed before merge
export function getIdentity(): DataModels.Iam.Identity {
  return Client.userTasks.identity;
}
