import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { Overlay, OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { FlowNodeInstance, FlowNodeInstanceState, ProcessInstance } from '@5minds/processcube_engine_sdk';

import { BottomButtonContainer } from './BottomButtonContainer';
import { DiagramDocumentationInspector, DiagramDocumentationInspectorRef } from './DiagramDocumentationInspector';

type ProcessInstanceInspectorProps = {
  processInstance: ProcessInstance & { xml: string };
  flowNodeInstances: FlowNodeInstance[];
  triggeredFlowNodeInstances: FlowNodeInstance[];
  handlePlay: (flowNodeInstanceId: string, flowNodeType: string) => void;
};

const byNewest = (a: FlowNodeInstance, b: FlowNodeInstance) => ((a.startedAt ?? 0) > (b.startedAt ?? 0) ? -1 : 1);

const RECEIVER_TYPES = ['bpmn:StartEvent', 'bpmn:IntermediateCatchEvent', 'bpmn:BoundaryEvent', 'bpmn:ReceiveTask'];
const SENDER_TYPES = ['bpmn:EndEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:SendTask'];

export function ProcessInstanceInspector({
  processInstance,
  flowNodeInstances,
  triggeredFlowNodeInstances,
  handlePlay,
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
        if (element.type === 'bpmn:SequenceFlow' && sequenceFlowFinished(element)) {
          bpmnViewer.addMarker(element.id, 'connection-done');
          return;
        }

        if (!flowNodeIds.has(element.id)) {
          return;
        }

        const matchingInstances = flowNodeInstances.filter((fni) => fni.flowNodeId === element.id).sort(byNewest)!;
        bpmnViewer.addMarker(element.id, `asdk-pii-flow-node-instance-state--${matchingInstances[0].state}`);

        const showExecutionCount = matchingInstances.length > 1;
        const showPlayButton =
          (element.type === 'bpmn:ManualTask' || element.type === 'bpmn:UserTask' || element.type === 'bpmn:Task') &&
          matchingInstances[0].state === FlowNodeInstanceState.suspended;

        let showGoToButton = false;
        let instancesToGoTo: FlowNodeInstance[] = [];
        if (RECEIVER_TYPES.includes(element.type)) {
          const triggeredByFlowNodeInstance = matchingInstances[0].triggeredByFlowNodeInstance;
          showGoToButton = triggeredByFlowNodeInstance !== undefined;
          instancesToGoTo = triggeredByFlowNodeInstance ? [triggeredByFlowNodeInstance] : [];
        } else if (SENDER_TYPES.includes(element.type)) {
          const matchingTriggeredInstances = triggeredFlowNodeInstances
            .filter(
              (fni) => fni.triggeredByFlowNodeInstance?.flowNodeInstanceId === matchingInstances[0].flowNodeInstanceId,
            )
            .sort(byNewest);

          showGoToButton = matchingTriggeredInstances.length > 0;
          instancesToGoTo = matchingTriggeredInstances;
        }

        if (showExecutionCount || showPlayButton || showGoToButton) {
          const overlayId = overlays.add(element.id, {
            position: {
              bottom: -7,
              left: 0,
            },
            html: '<div></div>',
          } as OverlayAttrs);

          const overlay = overlays.get(overlayId) as Overlay & { htmlContainer: HTMLElement };
          const htmlContainer = overlay.htmlContainer as HTMLElement;

          createRoot(htmlContainer).render(
            <BottomButtonContainer
              width={element.width}
              flowNodeInstances={matchingInstances}
              showExecutionCount={showExecutionCount}
              showPlayButton={showPlayButton}
              showGoToButton={showGoToButton}
              instancesToGoTo={instancesToGoTo}
              handlePlay={handlePlay}
              handleGoTo={(flowNodeInstances) => console.log('Go to:', flowNodeInstances)}
            />,
          );
        }
      });
    });
  }, [diagramDocumentationInspectorRef.current, flowNodeInstances]);

  return <DiagramDocumentationInspector xml={processInstance.xml} ref={diagramDocumentationInspectorRef} />;
}

export const ProcessInstanceInspectorNextJS = dynamic(() => Promise.resolve(ProcessInstanceInspector), {
  ssr: false,
});
