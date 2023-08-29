import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

/**
 * @param query The query options of {@link Client.processInstances.query}
 * @param query.query The query of {@link Client.processInstances.query}
 * @param query.options The options of {@link Client.processInstances.query}
 * @returns {DataModels.ProcessInstances.ProcessInstance[] | null}
 */
export async function getActiveProcessInstances(query?: {
  query?: Omit<DataModels.ProcessInstances.ProcessInstanceQuery, 'state'>;
  options?: Parameters<typeof Client.processInstances.query>[1];
}): Promise<DataModels.ProcessInstances.ProcessInstance[] | null> {
  const result = await Client.processInstances.query(
    {
      ...query?.query,
      state: DataModels.ProcessInstances.ProcessInstanceState.running,
    },
    query?.options
  );

  if (result.processInstances.length === 0) {
    return null;
  }

  return result.processInstances;
}
