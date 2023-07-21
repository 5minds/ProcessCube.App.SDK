import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { RedirectType } from 'next/dist/client/components/redirect';

import { DataModels } from '@5minds/processcube_engine_client';
import {
  getWaitingUserTaskByCorrelationId,
  getWaitingUserTaskByProcessInstanceId,
  getWaitingUserTasksByFlowNodeId,
} from '../lib';

export async function hardNavigate(url: string, type?: RedirectType) {
  revalidatePath(url);
  redirect(url, type);
}

/**
 * Navigates to the next UserTask in the given ProcessInstance. If there is no UserTask, the user will be redirected to the backupUrl. If no backupUrl is given, the app crashes if there is no UserTask.
 * @param processInstanceId ID of the ProcessInstance
 * @param backupUrl The url to redirect to, if there is no UserTask
 * @returns Promise<void>
 */
export async function navigateToNextUserTaskInProcess(processInstanceId: string, backupUrl?: string): Promise<void> {
  const userTask: DataModels.FlowNodeInstances.UserTaskInstance | null = await getWaitingUserTaskByProcessInstanceId(processInstanceId);

  if (userTask === null) {
    if (backupUrl) {
      redirect(backupUrl);
    }

    return;
  }

  await navigateToUserTaskInstance(userTask);
}

/**
 * Navigates to the next UserTask in the given Correlation. If there is no UserTask, the user will be redirected to the backupUrl. If no backupUrl is given, the app crashes if there is no UserTask.
 * @param backupUrl The url to redirect to, if there is no UserTask
 * @returns Promise<void>
 */
export async function navigateToNextUserTaskInCorrelation(correlationId: string, backupUrl?: string): Promise<void> {
  const userTask: DataModels.FlowNodeInstances.UserTaskInstance | null = await getWaitingUserTaskByCorrelationId(
    correlationId
  );

  if (userTask === null) {
    if (backupUrl) {
      redirect(backupUrl);
    }

    return;
  }

  await navigateToUserTaskInstance(userTask);
}

/**
 * Navigates to the next UserTask of the same FlowNodeId. If there is no UserTask, the user will be redirected to the backupUrl. If no backupUrl is given, the app crashes if there is no UserTask.
 * @param flowNodeId ID of the FlowNode
 * @param backupUrl The url to redirect to, if there is no UserTask
 * @returns Promise<void>
 */
export async function navigateToNextUserTaskOfSameFlowNodeId(flowNodeId: string, backupUrl?: string): Promise<void> {
  const userTaskList: DataModels.FlowNodeInstances.UserTaskList = await getWaitingUserTasksByFlowNodeId(flowNodeId);

  if (userTaskList.userTasks.length === 0) {
    if (backupUrl) {
      redirect(backupUrl);
    }

    return;
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
