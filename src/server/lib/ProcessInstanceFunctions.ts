import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

/**
 *
 * @param options The query options of {@link Client.processInstances.query}
 * @returns {DataModels.ProcessInstances.ProcessInstance[]}
 */
export async function getActiveProcessInstances(options?: Parameters<typeof Client.processInstances.query>[1]) {
  const result = await Client.processInstances.query(
    {
      state: DataModels.ProcessInstances.ProcessInstanceState.running,
    },

    options
  );

  if (result.totalCount === 0) {
    return null;
  }

  return result.processInstances;
}
