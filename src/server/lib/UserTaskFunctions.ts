import 'server-only';
import { EngineClient, DataModels } from '@5minds/processcube_engine_client';
import { getEngineUrl } from './internal/EngineUrlConfig';

const url = getEngineUrl();
const client = new EngineClient(url);

async function getUserTaskByFlowNodeInstanceId(flowNodeInstanceId?: string) {
  const result = await client.userTasks.query({ flowNodeInstanceId: flowNodeInstanceId });

  return result.userTasks[0];
}

async function getUserTaskByProcessInstanceId(processInstanceId: string, flowNodeId: string) {
  const result = await client.userTasks.query({ processInstanceId: processInstanceId, flowNodeId: flowNodeId });

  if (result.totalCount == 0) {
    return null;
  }

  return result.userTasks[0];
}

export async function waitForUserTaskByProcessInstanceId(
  processInstanceId: string,
  flowNodeId: string
): Promise<DataModels.FlowNodeInstances.UserTaskInstance> {
  return new Promise<DataModels.FlowNodeInstances.UserTaskInstance>(async (resolve) => {
    const promise = client.userTasks.onUserTaskWaiting(async (event) => {
      if (event.processInstanceId === processInstanceId && event.flowNodeId === flowNodeId) {
        const userTask = await getUserTaskByFlowNodeInstanceId(event.flowNodeInstanceId);
        resolve(userTask);
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
  await client.userTasks.finishUserTask(flowNodeInstanceId, result);

  const userTasks = await client.userTasks.query({
    flowNodeId: flowNodeId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (userTasks.totalCount > 0) {
    return userTasks.userTasks[0];
  }

  return null;
}
