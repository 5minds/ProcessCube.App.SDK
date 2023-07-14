import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

export async function getActiveProcessInstances() {
  const result = await Client.processInstances.query({
    state: DataModels.ProcessInstances.ProcessInstanceState.running,
  });

  if (result.totalCount === 0) {
    return null;
  }

  return result.processInstances;
}
