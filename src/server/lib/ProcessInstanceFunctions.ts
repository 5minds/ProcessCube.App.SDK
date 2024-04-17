import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';
import { getIdentity } from './getIdentity';

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
  const identity = await tryGetIdentity();

  const result = await Client.processInstances.query(
    { processInstanceId: processInstanceId },
    { identity:  identity }
  );

  return result.processInstances[0];
}

export async function getFlowNodeInstancesByProcessInstanceId(processInstanceId: string): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
  const identity = await tryGetIdentity();

  const result = await Client.flowNodeInstances.query({ processInstanceId: processInstanceId}, { sortSettings: { sortBy: DataModels.FlowNodeInstances.FlowNodeInstanceSortableColumns.createdAt, sortDir: 'ASC' }, identity: identity});

  return result.flowNodeInstances;
}

export async function getFlowNodeInstancesTriggeredByFlowNodeInstanceIds(
  flowNodeInstanceIds: string[],
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
    const identity = await tryGetIdentity();

    const queryResult = await Client.flowNodeInstances.query(
      {
        triggeredByFlowNodeInstance: flowNodeInstanceIds,
      },
      { identity: identity }
    );

    if (queryResult.totalCount > 0) {
      return queryResult.flowNodeInstances;
    }

    return [];
}

export async function retryProcessInstance(processInstanceId: string, flowNodeInstanceId?: string, newStartToken?: any) {
  const identity = await tryGetIdentity();
  
  await Client.processInstances.retryProcessInstance(processInstanceId, { 
      flowNodeInstanceId: flowNodeInstanceId, 
      newStartToken: newStartToken,
      identity: identity
  });
}

async function tryGetIdentity(): Promise<DataModels.Iam.Identity | undefined> {
  try {
    return await getIdentity();
  } catch {
    return undefined;
  }
}
