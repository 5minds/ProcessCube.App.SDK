import { DataModels, Identity } from '@5minds/processcube_engine_client';
import { Client } from './internal/EngineClient';

async function getUserTaskByProcessInstanceId(processInstanceId: string, flowNodeId: string) {
  const result = await Client.userTasks.query({
    processInstanceId: processInstanceId,
    flowNodeId: flowNodeId,
  });

  if (result.totalCount == 0) {
    return null;
  }

  return result.userTasks[0];
}

export async function waitForUserTaskByProcessInstanceId(processInstanceId: string, flowNodeId: string) {
  return new Promise<DataModels.FlowNodeInstances.UserTaskInstance>(async (resolve, reject) => {
    const promise = Client.userTasks.onUserTaskWaiting(async (event) => {
      if (
        event.processInstanceId === processInstanceId &&
        event.flowNodeId === flowNodeId &&
        event.flowNodeInstanceId != null
      ) {
        const userTask = await getWaitingUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId);
        if (userTask != null) {
          return resolve(userTask);
        }

        return reject(new Error(`UserTask with instance ID "${event.flowNodeInstanceId}" does not exist.`));
      }
    });

    const userTask = await getUserTaskByProcessInstanceId(processInstanceId, flowNodeId);

    if (userTask) {
      resolve(userTask);
    }

    await promise;
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
  return Client.userTasks.query(
    {
      state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
    },
    options
  );
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
