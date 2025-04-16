'use server';

import { DataModels, type Identity } from '@5minds/processcube_engine_client';

import {
  getFlowNodeInstancesByProcessInstanceId,
  getFlowNodeInstancesTriggeredByFlowNodeInstanceIds,
  getProcessInstanceById,
  retryProcessInstance,
  terminateProcessInstance,
} from './lib/ProcessInstanceFunctions';
import { getIdentity } from './lib/getIdentity';
import { finishManualTask, finishUntypedTask, finishUserTask } from './server-actions';

async function tryGetIdentity(): Promise<Identity | undefined> {
  try {
    return getIdentity();
  } catch {
    return undefined;
  }
}

export const finishTask = async (
  flowNodeInstanceId: string,
  flowNodeType: 'bpmn:UserTask' | 'bpmn:ManualTask' | 'bpmn:Task',
) => {
  const identity = await tryGetIdentity();
  if (flowNodeType === 'bpmn:UserTask') {
    await finishUserTask(flowNodeInstanceId, {}, identity);
  } else if (flowNodeType === 'bpmn:ManualTask') {
    await finishManualTask(flowNodeInstanceId, identity);
  } else if (flowNodeType === 'bpmn:Task') {
    await finishUntypedTask(flowNodeInstanceId, identity);
  } else {
    console.error(`[@5minds/processcube_app_sdk:handlePlay]\t\tUnsupported flow node type: ${flowNodeType}`);
  }
};

export const terminateProcess = async (processInstanceId: string) => {
  await terminateProcessInstance(processInstanceId);
};

export const retryProcess = async (processInstanceId: string, flowNodeInstanceId?: string, newStartToken?: any) => {
  await retryProcessInstance(processInstanceId, flowNodeInstanceId, newStartToken);
};

export const getProcessInstance = async (processInstanceId: string) => {
  return getProcessInstanceById(processInstanceId);
};

export const getFlowNodeInstances = async (
  processInstanceId: string,
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> => {
  return getFlowNodeInstancesByProcessInstanceId(processInstanceId, {
    sortSettings: { sortBy: DataModels.FlowNodeInstances.FlowNodeInstanceSortableColumns.createdAt, sortDir: 'DESC' },
  });
};

export const getTriggeredFlowNodeInstances = async (
  flowNodeInstanceIds: string[],
): Promise<DataModels.FlowNodeInstances.FlowNodeInstance[]> => {
  return getFlowNodeInstancesTriggeredByFlowNodeInstanceIds(flowNodeInstanceIds);
};
