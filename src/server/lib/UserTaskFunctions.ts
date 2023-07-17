import { DataModels, Messages, Subscription } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

/**
 * Waits for a UserTask to be created and returns it.
 * @param processInstanceId The ProcessInstance ID (BPMN)
 * @param flowNodeId  The FlowNode ID (BPMN)
 * @returns {Promise<DataModels.FlowNodeInstances.UserTaskInstance>} The created UserTask.
 */
export async function waitForUserTask(
  processInstanceId?: string,
  flowNodeId?: string
): Promise<DataModels.FlowNodeInstances.UserTaskInstance> {
  if (processInstanceId && flowNodeId) {
    return new Promise<DataModels.FlowNodeInstances.UserTaskInstance>(async (resolve, reject) => {
      const sub = await Client.userTasks.onUserTaskWaiting(async (event) => {
        if (
          event.flowNodeId !== flowNodeId ||
          event.processInstanceId !== processInstanceId ||
          event.flowNodeInstanceId === undefined
        ) {
          return;
        }

        const userTask = await getWaitingUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId);
        Client.notification.removeSubscription(sub);

        if (userTask === null) {
          return reject(new Error(`UserTask with instance ID "${event.flowNodeInstanceId}" does not exist.`));
        }

        return resolve(userTask);
      });
    });
  }

  if (processInstanceId) {
    return new Promise<DataModels.FlowNodeInstances.UserTaskInstance>(async (resolve, reject) => {
      const sub = await Client.userTasks.onUserTaskWaiting(async (event) => {
        if (event.flowNodeInstanceId === undefined || event.processInstanceId !== processInstanceId) {
          return;
        }

        const userTask = await getWaitingUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId);
        Client.notification.removeSubscription(sub);

        if (userTask === null) {
          return reject(new Error(`UserTask with instance ID "${event.flowNodeInstanceId}" does not exist.`));
        }

        return resolve(userTask);
      });
    });
  }

  if (flowNodeId) {
    throw new Error('Not implemented yet.');
  }

  return new Promise<DataModels.FlowNodeInstances.UserTaskInstance>(async (resolve, reject) => {
    const sub = await Client.userTasks.onUserTaskWaiting(async (event) => {
      if (event.flowNodeInstanceId === undefined) {
        return;
      }

      const userTask = await getWaitingUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId);
      Client.notification.removeSubscription(sub);

      if (userTask === null) {
        return reject(new Error(`UserTask with instance ID "${event.flowNodeInstanceId}" does not exist.`));
      }

      return resolve(userTask);
    });
  });
}

export async function finishUserTaskAndGetNext(flowNodeInstanceId: string, result: any, flowNodeId: string) {
  await Client.userTasks.finishUserTask(flowNodeInstanceId, result);

  const userTasks = await Client.userTasks.query({
    flowNodeId: flowNodeId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (userTasks.totalCount > 0) {
    return userTasks.userTasks[0];
  }

  return null;
}

export async function getUserTasks(...args: Parameters<typeof Client.userTasks.query>) {
  return Client.userTasks.query(...args);
}

/**
 *
 * @param options Additional options for the query e.g. `identity` or `sortSettings`
 * @returns DataModels.FlowNodeInstances.UserTaskList
 */
export async function getWaitingUserTasks(options?: Parameters<typeof Client.userTasks.query>[1]) {
  const result = await Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );

  if (result.totalCount === 0) {
    return null;
  }

  return result.userTasks;
}

/**
 *
 * @param flowNodeId The UserTasks ID (BPMN)
 * @param options Additional options for the query e.g. `identity` or `sortSettings`
 * @returns DataModels.FlowNodeInstances.UserTaskList
 */
export async function getWaitingUserTasksByFlowNodeId(
  flowNodeId: string | string[],
  options?: Parameters<typeof Client.userTasks.query>[1]
) {
  return Client.userTasks.query(
    {
      flowNodeId: flowNodeId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );
}

/**
 *
 * @param flowNodeInstanceId The UserTask Instance ID
 * @param options Additional options for the query e.g. `identity`
 * @returns DataModels.FlowNodeInstances.UserTaskInstance | null
 */
export async function getWaitingUserTaskByFlowNodeInstanceId(
  flowNodeInstanceId: string,
  options?: Parameters<typeof Client.userTasks.query>[1]
) {
  const result = await Client.userTasks.query(
    {
      flowNodeInstanceId: flowNodeInstanceId,
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );

  if (result.userTasks.length) {
    return result.userTasks[0];
  }

  return null;
}

/**
 * @param correlationId The Correlation ID
 * @returns DataModels.FlowNodeInstances.UserTaskInstance | null
 */
export async function getWaitingUserTaskByCorrelationId(correlationId: string) {
  const result = await Client.userTasks.query({
    correlationId: correlationId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (result.totalCount == 0) {
    return null;
  }

  return result.userTasks[0];
}

/**
 * @param identity The identity of the user
 * @param options Additional options for the query e.g. `sortSettings`
 * @returns DataModels.FlowNodeInstances.UserTaskInstance[] | null
 */
export async function getReservedUserTasksByIdentity(
  identity: DataModels.Iam.Identity,
  options?: {
    offset?: number;
    limit?: number;
    sortSettings?: DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings;
  }
) {
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

  if (reservedUserTasks.length) {
    return reservedUserTasks;
  }

  return null;
}

/**
 *
 * @param identity The identity of the user
 * @param options Additional options for the query e.g. `sortSettings`
 * @returns DataModels.FlowNodeInstances.UserTaskInstance[] | null
 */
export async function getAssignedUserTasksByIdentity(
  identity: DataModels.Iam.Identity,
  options?: {
    offset?: number;
    limit?: number;
    sortSettings?: DataModels.FlowNodeInstances.FlowNodeInstanceSortSettings;
  }
) {
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

  if (assignedUserTasks.length) {
    return assignedUserTasks;
  }

  return null;
}
