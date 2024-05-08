import { DataModels } from '@5minds/processcube_engine_client';
import type { Identity, UserTaskResult } from '@5minds/processcube_engine_sdk';

import { UserTaskInstance, UserTaskList, mapUserTask, mapUserTaskList } from '../../common';
import { getIdentity } from './getIdentity';
import { Client } from './internal/EngineClient';

/**
 * If there is no UserTask waiting, this function will wait for the next UserTask to be created.
 * If there is already a UserTask waiting, this function will return it.
 *
 * @param filterBy Additional filter options
 * @param filterBy.correlationId The ID of the correlation which contains the UserTask
 * @param filterBy.processInstanceId The ID of the ProcessInstance the UserTask belongs to
 * @param filterBy.flowNodeId The UserTask FlowNode ID (BPMN)
 * @param identity The Identity of the User or true if the implied identity schould be used
 * @returns {Promise<UserTaskInstance>} The created UserTask.
 */
export async function waitForUserTask(
  filterBy: {
    correlationId?: string;
    processInstanceId?: string;
    flowNodeId?: string;
  } = {},
  identity?: Identity | boolean,
): Promise<UserTaskInstance> {
  const { correlationId, processInstanceId, flowNodeId } = filterBy;
  const resolvedIdentity =
    typeof identity === 'boolean' ? (identity == true ? await getIdentity() : undefined) : identity;

  return new Promise<UserTaskInstance>(async (resolve, reject) => {
    const sub = await Client.userTasks.onUserTaskWaiting(
      async (event) => {
        const correlationIdGivenButNotMatching = correlationId !== undefined && event.correlationId !== correlationId;
        const flowNodeInstanceIdIsUndefined = event.flowNodeInstanceId === undefined;
        const processInstanceIdGivenButNotMatching =
          processInstanceId !== undefined && event.processInstanceId !== processInstanceId;
        const flowNodeIdGivenButNotMatching = flowNodeId !== undefined && event.flowNodeId !== flowNodeId;

        if (
          correlationIdGivenButNotMatching ||
          flowNodeInstanceIdIsUndefined ||
          processInstanceIdGivenButNotMatching ||
          flowNodeIdGivenButNotMatching
        ) {
          return;
        }

        const userTask = await getWaitingUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId as string, {
          identity: resolvedIdentity,
        });
        Client.notification.removeSubscription(sub, resolvedIdentity);

        if (userTask === null) {
          return reject(new Error(`UserTask with instance ID "${event.flowNodeInstanceId}" does not exist.`));
        }

        return resolve(userTask);
      },
      {
        identity: resolvedIdentity,
      },
    );

    const userTasks = await getUserTasks(
      {
        correlationId: correlationId,
        processInstanceId: processInstanceId,
        flowNodeId: flowNodeId,
        state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
      },
      {
        identity: resolvedIdentity,
      },
    );

    if (userTasks.userTasks.length > 0) {
      Client.notification.removeSubscription(sub, resolvedIdentity);
      resolve(userTasks.userTasks[0]);
    }
  });
}

/**
 * The FilterBy object can be used to filter the result set of the finishUserTaskAndGetNext function.
 * The next UserTask will be returned based on the given filter options.
 */
export type FilterBy = {
  processInstanceId?: string;
  flowNodeId?: string;
  correlationId?: string;
};

/**
 * Finishes the UserTask with the given flowNodeInstanceId and returns the next UserTask.
 * The next UserTask will be returned based on the given filter options.
 *
 * @param flowNodeInstanceId The ID of the flowNodeInstance to finish
 * @param FilterBy Additional filter options for the next UserTask
 * @param result The result of the UserTask
 * @param identity The Identity of the User or true if the implied identity schould be used
 * @returns {Promise<UserTaskInstance>} The next UserTask based on the given filter options.
 */
export async function finishUserTaskAndGetNext(
  flowNodeInstanceId: string,
  filterBy: FilterBy = {},
  result: UserTaskResult = {},
  identity?: Identity | boolean,
): Promise<UserTaskInstance | null> {
  const resolvedIdentity =
    typeof identity === 'boolean' ? (identity == true ? await getIdentity() : undefined) : identity;

  await Client.userTasks.finishUserTask(flowNodeInstanceId, result, resolvedIdentity);

  const queryOptions: {
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState;
  } & FilterBy = {
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    ...filterBy,
  };
  const userTasks = await Client.userTasks.query(queryOptions, {
    identity: resolvedIdentity,
  });

  return mapUserTask(userTasks.userTasks[0]);
}

export async function getUserTasks(...args: Parameters<typeof Client.userTasks.query>): Promise<UserTaskList> {
  const result = await Client.userTasks.query(...args);

  return mapUserTaskList(result);
}

/**
 *
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity} or {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<UserTaskList>}
 */
export async function getWaitingUserTasks(
  options?: Parameters<typeof Client.userTasks.query>[1],
): Promise<UserTaskList> {
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options,
  );

  return mapUserTaskList(result);
}

/**
 *
 * @param processInstanceId The Process Instance ID
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity} or {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<UserTaskList>}
 */
export async function getWaitingUserTasksByProcessInstanceId(
  processInstanceId: string | Array<string>,
  options?: Parameters<typeof Client.userTasks.query>[1],
): Promise<UserTaskList> {
  const result = await Client.userTasks.query(
    {
      processInstanceId: processInstanceId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options,
  );

  return mapUserTaskList(result);
}

/**
 *
 * @param flowNodeId The UserTasks ID (BPMN)
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity} or {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<UserTaskList>}
 */
export async function getWaitingUserTasksByFlowNodeId(
  flowNodeId: string | string[],
  options?: Parameters<typeof Client.userTasks.query>[1],
): Promise<UserTaskList> {
  const result = await Client.userTasks.query(
    {
      flowNodeId: flowNodeId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options,
  );

  return mapUserTaskList(result);
}

/**
 *
 * @param flowNodeInstanceId The UserTask Instance ID
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity}
 * @returns {Promise<UserTaskInstance | null>}
 */
export async function getWaitingUserTaskByFlowNodeInstanceId(
  flowNodeInstanceId: string,
  options?: Parameters<typeof Client.userTasks.query>[1],
): Promise<UserTaskInstance | null> {
  const result = await Client.userTasks.query(
    {
      flowNodeInstanceId: flowNodeInstanceId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    {
      ...options,
      limit: 1,
    },
  );

  if (result.userTasks.length === 0) {
    return null;
  }

  return mapUserTask(result.userTasks[0]);
}

/**
 * @param correlationId The Correlation ID
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity}
 * @returns {Promise<UserTaskList>}
 */
export async function getWaitingUserTasksByCorrelationId(
  correlationId: string,
  options?: Parameters<typeof Client.userTasks.query>[1],
): Promise<UserTaskList> {
  const result = await Client.userTasks.query(
    {
      correlationId: correlationId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options,
  );

  return mapUserTaskList(result);
}

/**
 * @param identity The identity of the user
 * @param options Additional options for the query e.g. {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<UserTaskList>}
 */
export async function getReservedUserTasksByIdentity(
  identity?: DataModels.Iam.Identity,
  options?: {
    offset?: number;
    limit?: number;
    sortSettings?: DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings;
  },
): Promise<UserTaskList> {
  const resolvedIdentity = identity || (await getIdentity());
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    {
      identity: resolvedIdentity,
      ...options,
    },
  );

  const reservedUserTasks = result.userTasks.filter((userTask) => userTask.actualOwnerId === resolvedIdentity.userId);
  result.userTasks = reservedUserTasks;

  return mapUserTaskList(result);
}

/**
 *
 * @param identity The identity of the user
 * @param options Additional options for the query e.g. {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<UserTaskList>}
 */
export async function getAssignedUserTasksByIdentity(
  identity?: DataModels.Iam.Identity,
  options?: {
    offset?: number;
    limit?: number;
    sortSettings?: DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings;
  },
): Promise<UserTaskList> {
  const resolvedIdentity = identity || (await getIdentity());
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    {
      identity: resolvedIdentity,
      ...options,
    },
  );

  const assignedUserTasks = result.userTasks.filter((userTask) =>
    userTask.assignedUserIds?.includes(resolvedIdentity.userId),
  );
  result.userTasks = assignedUserTasks;

  return mapUserTaskList(result);
}
