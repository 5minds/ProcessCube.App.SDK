import { DataModels } from '@5minds/processcube_engine_client';
import type { EventMessage, Identity, Subscription } from '@5minds/processcube_engine_sdk';

import { getIdentity } from './getIdentity';
import { Client } from './internal/EngineClient';

/**
 * This function will return the ProcessInstance with the given ID.
 *
 * @param processInstanceId The ID of the ProcessInstance
 * @returns {Promise<DataModels.ProcessInstances.ProcessInstance>} The {@link DataModels.ProcessInstances.ProcessInstance}
 */
export async function getProcessInstanceById(
  processInstanceId: string,
): Promise<DataModels.ProcessInstances.ProcessInstance> {
  // const identity = await getIdentity();

  const result = await Client.processInstances.query({ processInstanceId: processInstanceId });

  return result.processInstances[0];
}

/**
 * This function will return the FlowNodeInstances of the ProcessInstance with the given ID.
 *
 * @param processInstanceId The ID of the ProcessInstance
 * @returns {Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]>} The list of {@link DataModels.FlowNodeInstances.FlowNodeInstance}
 */
export async function getFlowNodeInstancesByProcessInstanceId(
  processInstanceId: string,
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> {
  // const identity = await getIdentity();

  const result = await Client.flowNodeInstances.query(
    { processInstanceId: processInstanceId },
    {
      sortSettings: { sortBy: DataModels.FlowNodeInstances.FlowNodeInstanceSortableColumns.createdAt, sortDir: 'ASC' },
      // identity: identity,
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
  // const identity = await getIdentity();

  const queryResult = await Client.flowNodeInstances.query(
    {
      triggeredByFlowNodeInstance: flowNodeInstanceIds,
    },
    // { identity: identity },
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
  // const identity = await getIdentity();

  await Client.processInstances.retryProcessInstance(processInstanceId, {
    flowNodeInstanceId: flowNodeInstanceId,
    newStartToken: newStartToken,
    // identity: identity,
  });
}

/**
 * This function will return the running ProcessInstances.
 * If `query` is given, the ProcessInstances will be filtered by this query.
 * If `options` are given, the ProcessInstances will be queried with these options.
 *
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
  },
  identity?: Identity,
): Promise<DataModels.ProcessInstances.ProcessInstance> {
  const { processInstanceId } = filterBy;

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
        { identity },
      );
      for (const sub of subscriptions) {
        Client.notification.removeSubscription(sub, identity);
      }

      if (processInstance.totalCount === 0) {
        return reject(new Error(`Process with instance ID "${event.processInstanceId}" does not exist.`));
      }

      return resolve(processInstance.processInstances[0]);
    };

    subscriptions.push(await Client.notification.onProcessEnded(handleSubscription, { identity }));
    subscriptions.push(await Client.notification.onProcessError(handleSubscription, { identity }));
    subscriptions.push(await Client.notification.onProcessTerminated(handleSubscription, { identity }));

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
        { identity },
      );

      if (finishedProcessInstance.totalCount > 0) {
        for (const sub of subscriptions) {
          Client.notification.removeSubscription(sub, identity);
        }
        resolve(finishedProcessInstance.processInstances[0]);
      }
    }
  });
}
