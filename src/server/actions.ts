'use server';

import {
  getFlowNodeInstancesByProcessInstanceId,
  getFlowNodeInstancesTriggeredByFlowNodeInstanceIds,
  getProcessInstanceById,
  retryProcessInstance,
  terminateProcessInstance,
} from './lib/ProcessInstanceFunctions';
import { finishManualTask, finishUntypedTask, finishUserTask } from './server-actions';

export const finishTask = async (
  flowNodeInstanceId: string,
  flowNodeType: 'bpmn:UserTask' | 'bpmn:ManualTask' | 'bpmn:Task',
) => {
  if (flowNodeType === 'bpmn:UserTask') {
    await finishUserTask(flowNodeInstanceId, {});
  } else if (flowNodeType === 'bpmn:ManualTask') {
    await finishManualTask(flowNodeInstanceId);
  } else if (flowNodeType === 'bpmn:Task') {
    await finishUntypedTask(flowNodeInstanceId);
  } else {
    console.error(`[@5minds/processcube_app_sdk:handlePlay]\t\tUnsupported flow node type: ${flowNodeType}`);
  }
};

export const terminateProcess = async (processInstanceId: string) => {
  await terminateProcessInstance(processInstanceId);
};

export const retryProcess = async (processInstanceId: string, flowNodeInstanceId?: string) => {
  await retryProcessInstance(processInstanceId, flowNodeInstanceId);
};

export const getProcessInstance = async (processInstanceId: string) => {
  return getProcessInstanceById(processInstanceId);
};

export const getFlowNodeInstances = async (processInstanceId: string) => {
  return getFlowNodeInstancesByProcessInstanceId(processInstanceId);
};

export const getTriggeredFlowNodeInstances = async (flowNodeInstanceIds: string[]) => {
  return getFlowNodeInstancesTriggeredByFlowNodeInstanceIds(flowNodeInstanceIds);
};
