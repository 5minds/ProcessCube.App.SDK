import { DataModels } from '@5minds/processcube_engine_client';
import type {
  EventMessage,
  FlowNodeInstance,
  GenericFlowNodeInstanceQuery,
  Identity,
  Subscription,
} from '@5minds/processcube_engine_sdk';

import { getIdentity } from './getIdentity';
import { Client } from './internal/EngineClient';

const MAX_IDS_PER_QUERY = 300;
const MAX_QUERY_RESULT_ENTRIES = 1000;

async function tryGetIdentity(): Promise<Identity | undefined> {
  try {
    return getIdentity();
  } catch {
    return undefined;
  }
}

/**
 * This function will return the ProcessInstance with the given ID.
 *
 * @param processInstanceId The ID of the ProcessInstance
 * @returns {Promise<DataModels.ProcessInstances.ProcessInstance>} The {@link DataModels.ProcessInstances.ProcessInstance}
 */
export async function getProcessInstanceById(
  processInstanceId: string,
): Promise<DataModels.ProcessInstances.ProcessInstance> {
  const identity = await tryGetIdentity();

  const result = await Client.processInstances.query({ processInstanceId: processInstanceId }, { identity: identity });

  return result.processInstances[0];
}

/**
 * This function will return the FlowNodeInstances of the ProcessInstance with the given ID.
 *
 * @param processInstanceId The ID of the {@link DataModels.ProcessInstances.ProcessInstance}
 * @param options The options for the {@link Client.flowNodeInstances.query}
 * @returns {Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]>} The list of {@link DataModels.FlowNodeInstances.FlowNodeInstance}
 */
export async function paginatedFlowNodeInstanceQuery(
  query: GenericFlowNodeInstanceQuery,
): Promise<Array<FlowNodeInstance>> {
  const flowNodeInstances: FlowNodeInstance[] = [];
  const identity = await tryGetIdentity();

  const flowNodeInstanceResult = await Client.flowNodeInstances.query(query, {
    identity: identity,
    limit: MAX_QUERY_RESULT_ENTRIES,
  });

  flowNodeInstances.push(...flowNodeInstanceResult.flowNodeInstances);

  if (flowNodeInstanceResult.flowNodeInstances.length !== flowNodeInstanceResult.totalCount) {
    const requiredQueries = Math.floor(
      flowNodeInstanceResult.totalCount / flowNodeInstanceResult.flowNodeInstances.length,
    );
    await Promise.all(
      new Array(requiredQueries).fill(null).map(async (_, index) => {
        const parallelFlowNodeInstanceResult = await Client.flowNodeInstances.query(query, {
          identity: identity,
          limit: MAX_QUERY_RESULT_ENTRIES,
          offset: MAX_QUERY_RESULT_ENTRIES * (index + 1),
        });
        flowNodeInstances.push(...parallelFlowNodeInstanceResult.flowNodeInstances);
      }),
    );
  }

  return flowNodeInstances;
}

export async function queryFlowNodeInstances(
  processInstanceId?: string,
  flowNodeInstanceIds?: string[],
): Promise<FlowNodeInstance[]> {
  if (!processInstanceId && !flowNodeInstanceIds) {
    return [];
  }

  const flowNodeInstances: Array<FlowNodeInstance> = [];

  if (flowNodeInstanceIds && flowNodeInstanceIds.length > MAX_IDS_PER_QUERY) {
    // Required to avoid too big headers, when requesting hundreds or thousands of flownodeinstanceids
    await Promise.all(
      new Array(Math.ceil(flowNodeInstanceIds.length / MAX_IDS_PER_QUERY)).fill(null).map(async (_, index) => {
        const partialFlowNodeInstances = await paginatedFlowNodeInstanceQuery({
          flowNodeInstanceId: flowNodeInstanceIds.slice(index * MAX_IDS_PER_QUERY, (index + 1) * MAX_IDS_PER_QUERY),
        });
        flowNodeInstances.push(...partialFlowNodeInstances);
      }),
    );
  } else {
    flowNodeInstances.push(
      ...(await paginatedFlowNodeInstanceQuery({
        processInstanceId: processInstanceId,
        flowNodeInstanceId: flowNodeInstanceIds,
      })),
    );
  }

  return flowNodeInstances;
  // const flowNodeInstanceIsSubProcess = (fni: FlowNodeInstance): boolean => fni.flowNodeType === BpmnType.subProcess;
  // const hasSubProcesses = flowNodeInstances.some(flowNodeInstanceIsSubProcess);
  // if (!hasSubProcesses) {
  //   return flowNodeInstances;
  // }

  // const subProcessFlowNodeInstances = await querySubProcessInstanceFlowNodeInstances();
  // const uniqueSubProcessFlowNodeInstances = subProcessFlowNodeInstances.filter(
  //   (fni) => !flowNodeInstanceIds?.includes(fni.flowNodeInstanceId),
  // );

  // return flowNodeInstances.concat(uniqueSubProcessFlowNodeInstances);
}

// export async function querySubProcessInstanceFlowNodeInstances(): Promise<FlowNodeInstance[]> {
//   if (!processModelId) {
//     return [];
//   }

//   if (!engineSupportsReworkedSubProcesses) {
//     const subProcessInstanceFlowNodeInstances = await paginatedFlowNodeInstanceQuery({
//       parentProcessInstanceId: processInstanceId,
//       processModelId: processModelId,
//     });

//     return subProcessInstanceFlowNodeInstances;
//   }

//   const embeddedProcessInstanceIds = await engineClient.processInstances.getChildProcessInstanceIds(
//     processInstanceId,
//     {
//       identity: identity,
//       includeNested: true,
//       parentFlowNodeType: BpmnType.subProcess,
//     },
//   );

//   const subProcessInstanceFlowNodeInstances: Array<FlowNodeInstance> = [];

//   // Required to avoid too big headers, when requesting hundreds or thousands of processinstanceids
//   await Promise.all(
//     new Array(Math.ceil(embeddedProcessInstanceIds.length / MAX_IDS_PER_QUERY)).fill(null).map(async (_, index) => {
//       const partialSubProcessInstanceFlowNodeInstances = await paginatedFlowNodeInstanceQuery({
//         processInstanceId: embeddedProcessInstanceIds.slice(
//           index * MAX_IDS_PER_QUERY,
//           (index + 1) * MAX_IDS_PER_QUERY,
//         ),
//       });
//       subProcessInstanceFlowNodeInstances.push(...partialSubProcessInstanceFlowNodeInstances);
//     }),
//   );

//   return subProcessInstanceFlowNodeInstances;
// }

/**
 * This function will return the FlowNodeInstances of the ProcessInstance with the given ID.
 *
 * @param processInstanceId The ID of the {@link DataModels.ProcessInstances.ProcessInstance}
 * @param options The options for the {@link Client.flowNodeInstances.query}
 * @returns {Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]>} The list of {@link DataModels.FlowNodeInstances.FlowNodeInstance}
 */
export async function getFlowNodeInstancesByProcessInstanceId(
  processInstanceId: string,
  options: Parameters<typeof Client.flowNodeInstances.query>[1] = {
    sortSettings: { sortBy: DataModels.FlowNodeInstances.FlowNodeInstanceSortableColumns.createdAt, sortDir: 'ASC' },
  },
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
  const result = await Client.flowNodeInstances.query(
    { processInstanceId: processInstanceId },
    {
      ...options,
      identity: options.identity ?? (await tryGetIdentity()),
    },
  );

  return result.flowNodeInstances;
}

/**
 * This function will return the FlowNodeInstances that are triggered by the FlowNodeInstances with the given IDs.
 *
 * @param flowNodeInstanceIds The IDs of the FlowNodeInstances
 * @returns {Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]>} The list of {@link DataModels.FlowNodeInstances.FlowNodeInstance}
 */
export async function getFlowNodeInstancesTriggeredByFlowNodeInstanceIds(
  flowNodeInstanceIds: string[],
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
  const identity = await tryGetIdentity();

  const queryResult = await Client.flowNodeInstances.query(
    {
      triggeredByFlowNodeInstance: flowNodeInstanceIds,
    },
    { identity: identity },
  );

  return queryResult.flowNodeInstances;
}

/**
 * This function will retry the ProcessInstance with the given ID.
 * If the `flowNodeInstanceId` is given, the ProcessInstance will be retried from this FlowNodeInstance.
 * If the `newStartToken` is given, the ProcessInstance will be retried with this StartToken.
 *
 * @param processInstanceId The ID of the ProcessInstance
 * @param flowNodeInstanceId The ID of the FlowNodeInstance
 * @param newStartToken The new StartToken
 */
export async function retryProcessInstance(
  processInstanceId: string,
  flowNodeInstanceId?: string,
  newStartToken?: any,
) {
  const identity = await tryGetIdentity();

  await Client.processInstances.retryProcessInstance(processInstanceId, {
    flowNodeInstanceId: flowNodeInstanceId,
    newStartToken: newStartToken,
    identity: identity,
  });
}

/**
 * This function will terminate the ProcessInstance with the given ID.
 *
 * @param processInstanceId The ID of the ProcessInstance
 * @param identity The Identity to use for the request
 */
export async function terminateProcessInstance(processInstanceId: string) {
  const identity = await tryGetIdentity();

  await Client.processInstances.terminateProcessInstance(processInstanceId, identity);
}

/**
 * This function will return the running ProcessInstances.
 * If `query` is given, the ProcessInstances will be filtered by this query.
 * If `options` are given, the ProcessInstances will be queried with these options.
 *
 * @param query.query The query of {@link Client.processInstances.query}
 * @param query.options The options of {@link Client.processInstances.query}
 * @param indentity The Identity fo the User
 * @returns The list of active process instances as promise {@link DataModels.ProcessInstances.ProcessInstanceList}
 */
export async function getActiveProcessInstances(
  query: {
    query?: Omit<DataModels.ProcessInstances.ProcessInstanceQuery, 'state'>;
    options: Omit<Parameters<typeof Client.processInstances.query>[1], 'identity'> & { identity?: Identity | boolean };
  } = { options: { identity: true } },
): Promise<DataModels.ProcessInstances.ProcessInstanceList> {
  switch (query.options.identity) {
    case true:
      query.options.identity = await getIdentity();
      break;
    case false:
      query.options.identity = undefined;
      break;
    case undefined:
      query.options.identity = await getIdentity();

      break;
  }
  const result = await Client.processInstances.query(
    {
      ...query?.query,
      state: DataModels.ProcessInstances.ProcessInstanceState.running,
    },
    query?.options as Parameters<typeof Client.processInstances.query>[1],
  );

  return result;
}

/**
 * This function will wait until a ProcessInstance is finished, terminated or errored.
 * If the ProcessInstance is already finished, it will instantly be returned.
 *
 * @param filterBy Additional filter options
 * @param filterBy.processInstanceId The ID of the ProcessInstance to wait for
 * @param identity The Identity to use for the request
 * @returns {Promise<DataModels.ProcessInstances.ProcessInstance>} The {@link DataModels.ProcessInstances.ProcessInstance}
 */
export async function waitForProcessEnd(
  filterBy: {
    processInstanceId?: string;
  } = {},
  identity: Identity | boolean = true,
): Promise<DataModels.ProcessInstances.ProcessInstance> {
  const { processInstanceId } = filterBy;
  const resolvedIdentity =
    typeof identity === 'boolean' ? (identity == true ? await getIdentity() : undefined) : identity;

  return new Promise<DataModels.ProcessInstances.ProcessInstance>(async (resolve, reject) => {
    const subscriptions: Array<Subscription> = [];

    const handleSubscription = async (event: EventMessage) => {
      const processInstanceIdGivenButNotMatching =
        processInstanceId !== undefined && event.processInstanceId !== processInstanceId;

      if (processInstanceIdGivenButNotMatching) {
        return;
      }

      const processInstance = await Client.processInstances.query(
        { processInstanceId: event.processInstanceId },
        { identity: resolvedIdentity },
      );
      for (const sub of subscriptions) {
        Client.notification.removeSubscription(sub, resolvedIdentity);
      }

      if (processInstance.totalCount === 0) {
        return reject(new Error(`Process with instance ID "${event.processInstanceId}" does not exist.`));
      }

      return resolve(processInstance.processInstances[0]);
    };

    subscriptions.push(await Client.notification.onProcessEnded(handleSubscription, { identity: resolvedIdentity }));
    subscriptions.push(await Client.notification.onProcessError(handleSubscription, { identity: resolvedIdentity }));
    subscriptions.push(
      await Client.notification.onProcessTerminated(handleSubscription, { identity: resolvedIdentity }),
    );

    if (processInstanceId) {
      const finishedProcessInstance = await Client.processInstances.query(
        {
          processInstanceId,
          state: [
            DataModels.ProcessInstances.ProcessInstanceState.finished,
            DataModels.ProcessInstances.ProcessInstanceState.terminated,
            DataModels.ProcessInstances.ProcessInstanceState.error,
          ],
        },
        { identity: resolvedIdentity },
      );

      if (finishedProcessInstance.totalCount > 0) {
        for (const sub of subscriptions) {
          Client.notification.removeSubscription(sub, resolvedIdentity);
        }
        resolve(finishedProcessInstance.processInstances[0]);
      }
    }
  });
}
