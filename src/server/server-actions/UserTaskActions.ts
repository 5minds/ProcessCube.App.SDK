import 'server-only';
import { DataModels, EngineClient } from '@5minds/processcube_engine_client';
import { getEngineUrl } from '../lib/internal/EngineUrlConfig';

const url = getEngineUrl();
const client = new EngineClient(url);

export async function startProcess(processModelId: string): Promise<DataModels.ProcessInstances.ProcessStartResponse> {
  return await client.processModels.startProcessInstance({ processModelId: processModelId });
}

export async function finishTask(flowNodeInstanceId: string, result: any) {
  await client.userTasks.finishUserTask(flowNodeInstanceId, result);
}
