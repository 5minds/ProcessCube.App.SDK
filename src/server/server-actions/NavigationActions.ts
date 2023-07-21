import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { DataModels } from '@5minds/processcube_engine_client';
import {
  getWaitingUserTaskByCorrelationId,
  getWaitingUserTaskByProcessInstanceId,
  getWaitingUserTasksByFlowNodeId,
} from '../lib';

/**
 * Navigates to the next UserTask in the given ProcessInstance. If there is no UserTask, an error is thrown.
 * @param processInstanceId ID of the ProcessInstance
 * @returns Promise<void>
 */
export async function navigateToNextUserTaskInProcess(processInstanceId: string): Promise<void> {
  const userTask: DataModels.FlowNodeInstances.UserTaskInstance | null = await getWaitingUserTaskByProcessInstanceId(
    processInstanceId
  );

  if (userTask === null) {
    throw new Error(
      `No valid Navigation Target, no suspended FlowNodeInstance found for ProcessInstance with ID ${processInstanceId}`
    );
  }

  await navigateToUserTaskInstance(userTask);
}

/**
 * Navigates to the next UserTask in the given ProcessInstance. If there is no UserTask, an error is thrown.
 * @param correlationId ID of the Correlation
 * @returns Promise<void>
 */
export async function navigateToNextUserTaskInCorrelation(correlationId: string): Promise<void> {
  const userTask: DataModels.FlowNodeInstances.UserTaskInstance | null = await getWaitingUserTaskByCorrelationId(
    correlationId
  );

  if (userTask === null) {
    throw new Error(
      `No valid Navigation Target, no suspended UserTaskInstance found for Correlation with ID ${correlationId}`
    );
  }

  await navigateToUserTaskInstance(userTask);
}

/**
 * Navigates to the next UserTask in the given ProcessInstance. If there is no UserTask, an error is thrown.
 * @param flowNodeId ID of the FlowNode
 * @returns Promise<void>
 */
export async function navigateToNextUserTaskOfSameFlowNodeId(flowNodeId: string): Promise<void> {
  const userTaskList: DataModels.FlowNodeInstances.UserTaskList = await getWaitingUserTasksByFlowNodeId(flowNodeId);

  if (userTaskList.userTasks.length === 0) {
    throw new Error(`No valid Navigation Target, no suspended FlowNodeInstance found for FlowNodeId ${flowNodeId}`);
  }

  const userTask: DataModels.FlowNodeInstances.UserTaskInstance = userTaskList.userTasks[0];

  await navigateToUserTaskInstance(userTask);
}

export async function navigateToUrl(url: string) {
  revalidatePath(url);
  redirect(url);
}

async function navigateToUserTaskInstance(userTaskInstance: DataModels.FlowNodeInstances.UserTaskInstance) {
  const processModelId: string = userTaskInstance.processModelId;
  const processInstanceId: string = userTaskInstance.processInstanceId;
  const flowNodeId: string = userTaskInstance.flowNodeId;

  const url: string = `/${processModelId}/${processInstanceId}/${flowNodeId}`;

  redirect(url);
}
