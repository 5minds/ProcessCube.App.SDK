import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { Overlay, OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { CommandPalette, CommandPaletteEntry, CommandPaletteProps } from './CommandPalette';
import { GoToButton } from './GoToButton';
import { PlayButton } from './PlayButton';
import { RetryButton } from './RetryButton';

const sortByNewest = (a: FlowNodeInstance, b: FlowNodeInstance) => ((a.startedAt ?? 0) > (b.startedAt ?? 0) ? -1 : 1);

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

const EMPTY_COMMAND_PALETTE_PROPS: CommandPaletteProps<FlowNodeInstance & CommandPaletteEntry> = {
  isOpen: false,
  placeholder: '',
  entries: [],
  onConfirm: () => {},
  onClose: () => {},
};

export function ProcessInstanceInspector({ processInstanceId }: { processInstanceId: string }) {
  const [commandPaletteProps, setCommandPaletteProps] = useState(EMPTY_COMMAND_PALETTE_PROPS);
  const [processInstance, setProcessInstance] = useState<ProcessInstance>();
  const [flowNodeInstances, setFlowNodeInstances] = useState<FlowNodeInstance[]>([]);
  const [triggeredFlowNodeInstances, setTriggeredFlowNodeInstances] = useState<FlowNodeInstance[]>([]);
  const diagramDocumentationInspectorRef = useRef<DiagramDocumentationInspectorRef>(null);

  const init = useCallback(async () => {
    const serverActions = import('../../../server/actions');
    const processInstancePromise = serverActions.then((actions) => actions.getProcessInstance(processInstanceId));
    const flowNodeInstancesPromise = serverActions.then((actions) => actions.getFlowNodeInstances(processInstanceId));
    const [processInstance, flowNodeInstances] = await Promise.all([processInstancePromise, flowNodeInstancesPromise]);

    const triggeredFlowNodeInstances = await serverActions.then((actions) =>
      actions.getTriggeredFlowNodeInstances(flowNodeInstances.map((fni) => fni.flowNodeInstanceId)),
    );

    setProcessInstance(processInstance);
    setFlowNodeInstances(flowNodeInstances);
    setTriggeredFlowNodeInstances(triggeredFlowNodeInstances);
  }, [processInstanceId]);

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
    init();
  }, [processInstanceId]);

  useEffect(() => {
    if (!processInstance?.xml) {
      return;
    }

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

        const matchingInstances = flowNodeInstances.filter((fni) => fni.flowNodeId === element.id).sort(sortByNewest)!;
        const shownInstance = matchingInstances[0];

        bpmnViewer.addMarker(element.id, `asdk-pii-flow-node-instance-state--${shownInstance.state}`);

        const showExecutionCount = matchingInstances.length > 1;
        const showPlayButton =
          PLAYABLE_TYPES.includes(element.type) && shownInstance.state === FlowNodeInstanceState.suspended;

        const showRetryButton =
          processInstance?.state === ProcessInstanceState.error ||
          processInstance?.state === ProcessInstanceState.terminated;

        let showGoToButton = false;
        let targetInstances: FlowNodeInstance[] = [];
        if (RECEIVER_TYPES.includes(element.type)) {
          const triggeredByFlowNodeInstance = shownInstance.triggeredByFlowNodeInstance;
          showGoToButton = triggeredByFlowNodeInstance !== undefined;
          targetInstances = triggeredByFlowNodeInstance ? [triggeredByFlowNodeInstance] : [];
        } else if (SENDER_TYPES.includes(element.type)) {
          const matchingTriggeredInstances = triggeredFlowNodeInstances
            .filter((fni) => fni.triggeredByFlowNodeInstance?.flowNodeInstanceId === shownInstance.flowNodeInstanceId)
            .sort(sortByNewest);

          showGoToButton = matchingTriggeredInstances.length > 0;
          targetInstances = matchingTriggeredInstances;
        }

        if (!showExecutionCount && !showPlayButton && !showRetryButton && !showGoToButton) {
          return;
        }

        const isTooNarrowForTwoButtons = element.width < 52;
        const overlayId = overlays.add(element.id, {
          position: {
            bottom: -7,
            left: isTooNarrowForTwoButtons ? -element.width / 2 : 0,
          },
          html: '<div></div>',
        } as OverlayAttrs);

        const overlay = overlays.get(overlayId) as Overlay & { htmlContainer: HTMLElement };
        const root = createRoot(overlay.htmlContainer);

        root.render(
          <BottomButtonContainer width={isTooNarrowForTwoButtons ? element.width * 2 : element.width}>
            {showExecutionCount && (
              <BottomButton className="app-sdk-select-none" title="Execution Count">
                {matchingInstances.length}
              </BottomButton>
            )}
            {showGoToButton && (
              <GoToButton
                onClick={() => {
                  if (targetInstances.length > 1) {
                    setCommandPaletteProps({
                      isOpen: true,
                      placeholder: 'Select target to go to:',
                      entries: targetInstances.map((fni) => ({
                        id: fni.flowNodeInstanceId,
                        name: `${fni.startedAt?.toLocaleString('en-GB')} - ${fni.flowNodeId}${fni.flowNodeName ? ` - ${fni.flowNodeName}` : ''}`,
                        ...fni,
                      })),
                      onConfirm: (entry) => {
                        // Not using the useRouter hook, because the component should be able to run in non-Next.js environments
                        window.location.href = `${entry.processInstanceId}?selected=${entry.flowNodeId}`;
                      },
                      onClose: () => setCommandPaletteProps(EMPTY_COMMAND_PALETTE_PROPS),
                    });
                    return;
                  }

                  window.location.href = `${targetInstances[0].processInstanceId}?selected=${targetInstances[0].flowNodeId}`;
                }}
              />
            )}
            {showPlayButton && (
              <PlayButton flowNodeInstanceId={shownInstance.flowNodeInstanceId} flowNodeType={element.type} />
            )}
            {showRetryButton && (
              <RetryButton
                processInstanceId={shownInstance.processInstanceId}
                flowNodeInstanceId={shownInstance.flowNodeInstanceId}
              />
            )}
          </BottomButtonContainer>,
        );
      });
    });
  }, [diagramDocumentationInspectorRef.current, processInstance, flowNodeInstances, triggeredFlowNodeInstances]);

  if (!processInstance?.xml) {
    return (
      <div className="app-sdk-absolute app-sdk-w-screen app-sdk-h-screen app-sdk-flex">
        <div className="app-sdk-m-auto">Fetching diagram...</div>
      </div>
    );
  }

  return (
    <>
      <CommandPalette {...commandPaletteProps} />
      <DiagramDocumentationInspector xml={processInstance.xml} ref={diagramDocumentationInspectorRef} />
    </>
  );
}

export const ProcessInstanceInspectorNextJS = dynamic(() => Promise.resolve(ProcessInstanceInspector), {
  ssr: false,
});
