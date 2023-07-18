import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { RedirectType } from 'next/dist/client/components/redirect';
import { Client } from '../lib/internal/EngineClient';
import { DataModels } from '@5minds/processcube_engine_client';

export async function hardNavigate(url: string, type?: RedirectType) {
  revalidatePath(url);
  redirect(url, type);
}

export async function navigateToNextTaskInProcess(processInstanceId: string): Promise<void> {
  const userTasks: DataModels.FlowNodeInstances.UserTaskList = await Client.userTasks.query({
    processInstanceId: processInstanceId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  const userTask: DataModels.FlowNodeInstances.UserTaskInstance = userTasks.userTasks[0];
  console.log(userTask);

  const processModelId: string = userTask.processModelId;
  const flowNodeId: string = userTask.flowNodeId;

  const uri: string = `/${processModelId}/${processInstanceId}/${flowNodeId}`;

  if (userTask) {
    redirect(uri);
  }
}

export async function navigateToNextTaskInCorrelation(flowNodeInstanceId: string, result: any, flowNodeId: string) {
  await Client.userTasks.finishUserTask(flowNodeInstanceId, result);

  const userTasks = await Client.userTasks.query({
    flowNodeId: flowNodeId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  console.log(userTasks);

  redirect("/");
}

export async function navigateToNextTaskOfSameType(flowNodeInstanceId: string, result: any, flowNodeId: string) {
  await Client.userTasks.finishUserTask(flowNodeInstanceId, result);

  const userTasks = await Client.userTasks.query({
    flowNodeId: flowNodeId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  console.log(userTasks);

  redirect("/");
}

export async function navigateToUrl(url: string) {
  redirect(url);
}
