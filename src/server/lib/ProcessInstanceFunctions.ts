import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

/**
 * @param processModelId The ID of the ProcessModel the ProcessInstance belongs to
 * @param options The query options of {@link Client.processInstances.query}
 * @returns {DataModels.ProcessInstances.ProcessInstance[] | null}
 */
export async function getActiveProcessInstances(
  processModelId?: string,
  options?: Parameters<typeof Client.processInstances.query>[1]
): Promise<DataModels.ProcessInstances.ProcessInstance[] | null> {
  const result = await Client.processInstances.query(
    {
      processModelId: processModelId,
      state: DataModels.ProcessInstances.ProcessInstanceState.running,
    },
    options
  );

  if (result.processInstances.length === 0) {
    return null;
  }

  return result.processInstances;
}
