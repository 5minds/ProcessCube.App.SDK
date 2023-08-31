import { DataModels } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

/**
 * If there is no UserTask waiting, this function will wait for the next UserTask to be created.
 * If there is already a UserTask waiting, this function will return it.
 *
 * @param filterBy Additional filter options
 * @param filterBy.processInstanceId The ID of the ProcessInstance the UserTask belongs to
 * @param filterBy.flowNodeId The UserTask FlowNode ID (BPMN)
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskInstance>} The created UserTask.
 */
export async function waitForUserTask(
  filterBy: {
    processInstanceId?: string;
    flowNodeId?: string;
  } = {}
): Promise<DataModels.FlowNodeInstances.UserTaskInstance> {
  const { processInstanceId, flowNodeId } = filterBy;

  return new Promise<DataModels.FlowNodeInstances.UserTaskInstance>(async (resolve, reject) => {
    const sub = await Client.userTasks.onUserTaskWaiting(async (event) => {
      const flowNodeInstanceIdIsUndefined = event.flowNodeInstanceId === undefined;
      const processInstanceIdGivenButNotMatching =
        processInstanceId !== undefined && event.processInstanceId !== processInstanceId;
      const flowNodeIdGivenButNotMatching = flowNodeId !== undefined && event.flowNodeId !== flowNodeId;
      const processInstanceIdAndFlowNodeIdGivenButNotMatching =
        processInstanceId !== undefined &&
        flowNodeId !== undefined &&
        event.processInstanceId !== processInstanceId &&
        event.flowNodeId !== flowNodeId;

      if (
        flowNodeInstanceIdIsUndefined ||
        processInstanceIdGivenButNotMatching ||
        flowNodeIdGivenButNotMatching ||
        processInstanceIdAndFlowNodeIdGivenButNotMatching
      ) {
        return;
      }

      const userTask = await getWaitingUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId as string);
      Client.notification.removeSubscription(sub);

      if (userTask === null) {
        return reject(new Error(`UserTask with instance ID "${event.flowNodeInstanceId}" does not exist.`));
      }

      return resolve(userTask);
    });

    const userTasks = await getUserTasks({
      processInstanceId: processInstanceId,
      flowNodeId: flowNodeId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    });
    const userTask = userTasks.userTasks[0];

    if (userTask) {
      Client.notification.removeSubscription(sub);
      resolve(userTask);
    }
  });
}

export async function finishUserTaskAndGetNext(flowNodeInstanceId: string, result: any, flowNodeId: string) {
  await Client.userTasks.finishUserTask(flowNodeInstanceId, result);

  const userTasks = await Client.userTasks.query({
    flowNodeId: flowNodeId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (userTasks.userTasks.length === 0) {
    return null;
  }

  return userTasks.userTasks[0];
}

export async function getUserTasks(...args: Parameters<typeof Client.userTasks.query>) {
  const result = await Client.userTasks.query(...args);

  return result;
}

/**
 *
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity} or {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskList>}
 */
export async function getWaitingUserTasks(
  options?: Parameters<typeof Client.userTasks.query>[1]
): Promise<DataModels.FlowNodeInstances.UserTaskList> {
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );

  return result;
}

/**
 *
 * @param processInstanceId The Process Instance ID
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity} or {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<Array<DataModels.FlowNodeInstances.UserTaskInstance> | null>}
 */
export async function getWaitingUserTasksByProcessInstanceId(
  processInstanceId: string | Array<string>,
  options?: Parameters<typeof Client.userTasks.query>[1]
): Promise<Array<DataModels.FlowNodeInstances.UserTaskInstance> | null> {
  const result = await Client.userTasks.query(
    {
      processInstanceId: processInstanceId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );

  if (result.userTasks.length === 0) {
    return null;
  }

  return result.userTasks;
}

/**
 *
 * @param flowNodeId The UserTasks ID (BPMN)
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity} or {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskList>}
 */
export async function getWaitingUserTasksByFlowNodeId(
  flowNodeId: string | string[],
  options?: Parameters<typeof Client.userTasks.query>[1]
): Promise<DataModels.FlowNodeInstances.UserTaskList> {
  const result = await Client.userTasks.query(
    {
      flowNodeId: flowNodeId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );

  return result;
}

/**
 *
 * @param flowNodeInstanceId The UserTask Instance ID
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity}
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskInstance | null>}
 */
export async function getWaitingUserTaskByFlowNodeInstanceId(
  flowNodeInstanceId: string,
  options?: Parameters<typeof Client.userTasks.query>[1]
): Promise<DataModels.FlowNodeInstances.UserTaskInstance | null> {
  const result = await Client.userTasks.query(
    {
      flowNodeInstanceId: flowNodeInstanceId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    {
      ...options,
      limit: 1,
    }
  );

  if (result.userTasks.length === 0) {
    return null;
  }

  return result.userTasks[0];
}

/**
 * @param correlationId The Correlation ID
 * @param options Additional options for the query e.g. {@link DataModels.Iam.Identity}
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskList>}
 */
export async function getWaitingUserTasksByCorrelationId(
  correlationId: string,
  options?: Parameters<typeof Client.userTasks.query>[1]
): Promise<DataModels.FlowNodeInstances.UserTaskList> {
  const result = await Client.userTasks.query(
    {
      correlationId: correlationId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );

  return result;
}

/**
 * @param identity The identity of the user
 * @param options Additional options for the query e.g. {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskList>}
 */
export async function getReservedUserTasksByIdentity(
  identity: DataModels.Iam.Identity,
  options?: {
    offset?: number;
    limit?: number;
    sortSettings?: DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings;
  }
): Promise<DataModels.FlowNodeInstances.UserTaskList> {
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    {
      identity: identity,
      ...options,
    }
  );

  const reservedUserTasks = result.userTasks.filter((userTask) => userTask.actualOwnerId === identity.userId);
  result.userTasks = reservedUserTasks;

  return result;
}

/**
 *
 * @param identity The identity of the user
 * @param options Additional options for the query e.g. {@link DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings}
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskList>}
 */
export async function getAssignedUserTasksByIdentity(
  identity: DataModels.Iam.Identity,
  options?: {
    offset?: number;
    limit?: number;
    sortSettings?: DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings;
  }
): Promise<DataModels.FlowNodeInstances.UserTaskList> {
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    {
      identity: identity,
      ...options,
    }
  );

  const assignedUserTasks = result.userTasks.filter((userTask) => userTask.assignedUserIds?.includes(identity.userId));
  result.userTasks = assignedUserTasks;

  return result;
}
