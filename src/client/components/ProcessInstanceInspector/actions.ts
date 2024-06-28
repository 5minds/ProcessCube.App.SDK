'use server';

import {
  finishManualTask,
  finishUntypedTask,
  finishUserTask,
  getFlowNodeInstancesByProcessInstanceId,
  getFlowNodeInstancesTriggeredByFlowNodeInstanceIds,
  getProcessInstanceById,
  retryProcessInstance,
} from '../../../server';

export const handlePlay = async (flowNodeInstanceId: string, flowNodeType: string) => {
  if (flowNodeType === 'bpmn:UserTask') {
    await finishUserTask(flowNodeInstanceId, {});
  } else if (flowNodeType === 'bpmn:ManualTask') {
    await finishManualTask(flowNodeInstanceId);
  } else if (flowNodeType === 'bpmn:Task') {
    await finishUntypedTask(flowNodeInstanceId);
  } else {
    console.error('Unsupported flow node type');
  }
};

export const handleRetry = async (processInstanceId: string, flowNodeInstanceId?: string) => {
  await retryProcessInstance(processInstanceId, flowNodeInstanceId);
};

export const getProcessInstance = async (processInstanceId: string) => {
  return await getProcessInstanceById(processInstanceId);
};

export const getFlowNodeInstances = async (processInstanceId: string) => {
  return await getFlowNodeInstancesByProcessInstanceId(processInstanceId);
};

export const getTriggeredFlowNodeInstances = async (flowNodeInstanceIds: string[]) => {
  return await getFlowNodeInstancesTriggeredByFlowNodeInstanceIds(flowNodeInstanceIds);
};
