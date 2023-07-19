import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { RedirectType } from 'next/dist/client/components/redirect';

import { BpmnType, DataModels } from '@5minds/processcube_engine_client';
import { Client } from '../lib/internal/EngineClient';

export async function hardNavigate(url: string, type?: RedirectType) {
  revalidatePath(url);
  redirect(url, type);
}

export async function navigateToNextTaskInProcess(processInstanceId: string): Promise<void> {
  const flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstanceList = await Client.flowNodeInstances.query({
    processInstanceId: processInstanceId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (flowNodeInstances.totalCount === 0) {
    redirect("/");
  }

  const flowNodeInstance: DataModels.FlowNodeInstances.FlowNodeInstance = flowNodeInstances.flowNodeInstances[0];

  const processModelId: string = flowNodeInstance.processModelId;
  const flowNodeId: string = flowNodeInstance.flowNodeId;

  const uri: string = `/${processModelId}/${processInstanceId}/${flowNodeId}`;

  redirect(uri);
}

export async function navigateToNextTaskInCorrelation(correlationId: string) {
  const flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstanceList = await Client.flowNodeInstances.query({
    correlationId: correlationId,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (flowNodeInstances.totalCount === 0) {
    redirect("/");
  }

  const flowNodeInstance: DataModels.FlowNodeInstances.FlowNodeInstance = flowNodeInstances.flowNodeInstances[0];

  const processModelId: string = flowNodeInstance.processModelId;
  const processInstanceId: string = flowNodeInstance.processInstanceId;
  const flowNodeId: string = flowNodeInstance.flowNodeId;

  const uri: string = `/${processModelId}/${processInstanceId}/${flowNodeId}`;

  redirect(uri);
}

export async function navigateToNextTaskOfSameType(flowNodeType: BpmnType) {
  const flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstanceList = await Client.flowNodeInstances.query({
    flowNodeType: flowNodeType,
    state: DataModels.FlowNodeInstances.FlowNodeInstanceState.suspended,
  });

  if (flowNodeInstances.totalCount === 0) {
    redirect("/");
  }

  const flowNodeInstance: DataModels.FlowNodeInstances.FlowNodeInstance = flowNodeInstances.flowNodeInstances[0];

  const processModelId: string = flowNodeInstance.processModelId;
  const processInstanceId: string = flowNodeInstance.processInstanceId;
  const flowNodeId: string = flowNodeInstance.flowNodeId;

  const uri: string = `/${processModelId}/${processInstanceId}/${flowNodeId}`;

  redirect(uri);
}

export async function navigateToUrl(url: string) {
  revalidatePath(url);
  redirect(url);
}
