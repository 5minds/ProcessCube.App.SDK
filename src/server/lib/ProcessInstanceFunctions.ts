import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

/**
 * @param query.query The query of {@link Client.processInstances.query}
 * @param query.options The options of {@link Client.processInstances.query}
 * @returns The list of active process instances as promise {@link DataModels.ProcessInstances.ProcessInstanceList}
 */
export async function getActiveProcessInstances(query?: {
  query?: Omit<DataModels.ProcessInstances.ProcessInstanceQuery, 'state'>;
  options?: Parameters<typeof Client.processInstances.query>[1];
}): Promise<DataModels.ProcessInstances.ProcessInstanceList> {
  const result = await Client.processInstances.query(
    {
      ...query?.query,
      state: DataModels.ProcessInstances.ProcessInstanceState.running,
    },
    query?.options,
  );

  return result;
}

export async function getProcessInstanceById(processInstanceId: string): Promise<DataModels.ProcessInstances.ProcessInstance> {

  const result = await Client.processInstances.query({ processInstanceId: processInstanceId});

  return result.processInstances[0];
}

export async function getFlowNodeInstancesByProcessInstanceId(processInstanceId: string): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
  const result = await Client.flowNodeInstances.query({ processInstanceId: processInstanceId}, { sortSettings: { sortBy: DataModels.FlowNodeInstances.FlowNodeInstanceSortableColumns.createdAt, sortDir: 'ASC' }});

  return result.flowNodeInstances;
}

export async function getFlowNodeInstancesTriggeredByFlowNodeInstanceIds(
  flowNodeInstanceIds: string[],
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
    const queryResult = await Client.flowNodeInstances.query(
      {
        triggeredByFlowNodeInstance: flowNodeInstanceIds,
      }
    );

    if (queryResult.totalCount > 0) {
      return queryResult.flowNodeInstances;
    }

    return [];
}

export async function retryProcessInstance(processInstanceId: string, flowNodeInstanceId?: string, newStartToken?: any) {
  await Client.processInstances.retryProcessInstance(processInstanceId, { 
      flowNodeInstanceId: flowNodeInstanceId, 
      newStartToken: newStartToken
  });
}
