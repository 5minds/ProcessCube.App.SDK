import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { Overlay, OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import {
  FlowNodeInstance,
  FlowNodeInstanceState,
  ProcessInstance,
  ProcessInstanceState,
} from '@5minds/processcube_engine_sdk';

import { DiagramDocumentationInspector, DiagramDocumentationInspectorRef } from '../DiagramDocumentationInspector';
import { BottomButton } from './BottomButton';
import { BottomButtonContainer } from './BottomButtonContainer';
import { GoToButton } from './GoToButton';
import { PlayButton } from './PlayButton';
import { RetryButton } from './RetryButton';

const byNewest = (a: FlowNodeInstance, b: FlowNodeInstance) => ((a.startedAt ?? 0) > (b.startedAt ?? 0) ? -1 : 1);

enum FlowNodeType {
  boundaryEvent = 'bpmn:BoundaryEvent',
  endEvent = 'bpmn:EndEvent',
  intermediateCatchEvent = 'bpmn:IntermediateCatchEvent',
  intermediateThrowEvent = 'bpmn:IntermediateThrowEvent',
  manualTask = 'bpmn:ManualTask',
  receiveTask = 'bpmn:ReceiveTask',
  sendTask = 'bpmn:SendTask',
  sequenceFlow = 'bpmn:SequenceFlow',
  startEvent = 'bpmn:StartEvent',
  task = 'bpmn:Task',
  userTask = 'bpmn:UserTask',
}

const PLAYABLE_TYPES = [FlowNodeType.manualTask, FlowNodeType.userTask, FlowNodeType.task];
const SENDER_TYPES = [FlowNodeType.endEvent, FlowNodeType.intermediateThrowEvent, FlowNodeType.sendTask];
const RECEIVER_TYPES = [
  FlowNodeType.startEvent,
  FlowNodeType.intermediateCatchEvent,
  FlowNodeType.boundaryEvent,
  FlowNodeType.receiveTask,
];

type ProcessInstanceInspectorProps = {
  processInstance: ProcessInstance & { xml: string };
  flowNodeInstances: FlowNodeInstance[];
  triggeredFlowNodeInstances: FlowNodeInstance[];
  handlePlay: (flowNodeInstanceId: string, flowNodeType: string) => void;
  handleGoTo: (flowNodeInstance: FlowNodeInstance) => void;
  handleRetry: (flowNodeInstanceId?: string) => void;
};

export function ProcessInstanceInspector({
  processInstance,
  flowNodeInstances,
  triggeredFlowNodeInstances,
  handlePlay,
  handleGoTo,
  handleRetry,
}: ProcessInstanceInspectorProps) {
  const diagramDocumentationInspectorRef = useRef<DiagramDocumentationInspectorRef>(null);

  const sequenceFlowFinished = useCallback(
    (element: ElementLike) => {
      const businessObject = getBusinessObject(element);
      const targetInstanceExists = flowNodeInstances.some((fni) => fni.flowNodeId === businessObject.targetRef.id);
      const finishedSourceInstanceExists = flowNodeInstances.some(
        (fni) => fni.flowNodeId === businessObject.sourceRef.id && fni.state === FlowNodeInstanceState.finished,
      );

      return targetInstanceExists && finishedSourceInstanceExists;
    },
    [flowNodeInstances],
  );

  useEffect(() => {
    const bpmnViewer = diagramDocumentationInspectorRef.current?.bpmnViewerRef;
    const overlays = bpmnViewer?.getOverlays();
    const elementRegistry = bpmnViewer?.getElementRegistry();

    if (!bpmnViewer || !overlays || !elementRegistry) {
      return;
    }

    bpmnViewer.onImportDone(() => {
      const flowNodeIds = new Set(flowNodeInstances.map((fni) => fni.flowNodeId));

      elementRegistry.forEach((element: ElementLike) => {
        if (element.type === FlowNodeType.sequenceFlow && sequenceFlowFinished(element)) {
          bpmnViewer.addMarker(element.id, 'asdk-pii-sequence-flow-finished');
          return;
        }

        if (!flowNodeIds.has(element.id)) {
          return;
        }

        const matchingInstances = flowNodeInstances.filter((fni) => fni.flowNodeId === element.id).sort(byNewest)!;
        bpmnViewer.addMarker(element.id, `asdk-pii-flow-node-instance-state--${matchingInstances[0].state}`);

        const showExecutionCount = matchingInstances.length > 1;
        const showPlayButton =
          PLAYABLE_TYPES.includes(element.type) && matchingInstances[0].state === FlowNodeInstanceState.suspended;

        let showGoToButton = false;
        let targetInstances: FlowNodeInstance[] = [];
        if (RECEIVER_TYPES.includes(element.type)) {
          const triggeredByFlowNodeInstance = matchingInstances[0].triggeredByFlowNodeInstance;
          showGoToButton = triggeredByFlowNodeInstance !== undefined;
          targetInstances = triggeredByFlowNodeInstance ? [triggeredByFlowNodeInstance] : [];
        } else if (SENDER_TYPES.includes(element.type)) {
          const matchingTriggeredInstances = triggeredFlowNodeInstances
            .filter(
              (fni) => fni.triggeredByFlowNodeInstance?.flowNodeInstanceId === matchingInstances[0].flowNodeInstanceId,
            )
            .sort(byNewest);

          showGoToButton = matchingTriggeredInstances.length > 0;
          targetInstances = matchingTriggeredInstances;
        }

        const showRetryButton =
          processInstance.state === ProcessInstanceState.error ||
          processInstance.state === ProcessInstanceState.terminated;

        if (!showExecutionCount && !showPlayButton && !showGoToButton && !showRetryButton) {
          return;
        }

        const overlayId = overlays.add(element.id, {
          position: {
            bottom: -7,
            left: element.width < 52 ? -element.width / 2 : 0,
          },
          html: '<div></div>',
        } as OverlayAttrs);

        const overlay = overlays.get(overlayId) as Overlay & { htmlContainer: HTMLElement };
        const htmlContainer = overlay.htmlContainer as HTMLElement;
        const root = createRoot(htmlContainer);

        root.render(
          <BottomButtonContainer width={element.width < 52 ? element.width * 2 : element.width}>
            {showExecutionCount && <BottomButton>{matchingInstances.length}</BottomButton>}
            {showGoToButton && <GoToButton onClick={() => handleGoTo(targetInstances[0])} />}
            {showPlayButton && (
              <PlayButton
                onClick={() => handlePlay(matchingInstances[0].flowNodeInstanceId, matchingInstances[0].flowNodeType)}
              />
            )}
            {showRetryButton && <RetryButton onClick={() => handleRetry(matchingInstances[0].flowNodeInstanceId)} />}
          </BottomButtonContainer>,
        );
      });
    });
  }, [diagramDocumentationInspectorRef.current, flowNodeInstances]);

  return <DiagramDocumentationInspector xml={processInstance.xml} ref={diagramDocumentationInspectorRef} />;
}

export const ProcessInstanceInspectorNextJS = dynamic(() => Promise.resolve(ProcessInstanceInspector), {
  ssr: false,
});
