import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { Overlay, OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import Overlays from 'diagram-js/lib/features/overlays/Overlays';
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

import { BPMNViewerFunctions } from '../BPMNViewer';
import { DiagramDocumentationInspector, DiagramDocumentationInspectorRef } from '../DiagramDocumentationInspector';
import { BottomButton } from './BottomButton';
import { BottomButtonContainer } from './BottomButtonContainer';
import { CommandPalette, CommandPaletteEntry, CommandPaletteProps } from './CommandPalette';
import { GoToButton } from './GoToButton';
import { ListButton } from './ListButton';
import { PlayButton } from './PlayButton';
import { ProcessButtonsContainer } from './ProcessButtonsContainer';
import { RefreshProcessButton } from './RefreshProcessButton';
import { RetryButton } from './RetryButton';
import { RetryProcessButton } from './RetryProcessButton';

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

const RETRYABLE_STATES = [ProcessInstanceState.error, ProcessInstanceState.terminated];
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

const SDK_OVERLAY_BUTTONS_TYPE = 'asdk-buttons';

type ProcessInstanceInspectorProps = {
  processInstanceId: string;
  showExecutionCount?: boolean;
  showGoToButton?: boolean;
  showListButton?: boolean;
  showPlayButton?: boolean;
  showRetryButton?: boolean;
  showRefreshButton?: boolean;
};

/**
 * Displays a BPMN diagram with additional information about the process instance.
 * The diagram is interactive and allows the user to inspect the flow node instances and navigate to related flow nodes.
 */
export function ProcessInstanceInspector(props: ProcessInstanceInspectorProps) {
  const [commandPaletteProps, setCommandPaletteProps] = useState(EMPTY_COMMAND_PALETTE_PROPS);
  const [processInstance, setProcessInstance] = useState<ProcessInstance>();
  const [flowNodeInstances, setFlowNodeInstances] = useState<FlowNodeInstance[]>([]);
  const [triggeredFlowNodeInstances, setTriggeredFlowNodeInstances] = useState<FlowNodeInstance[]>([]);
  const [shownInstancesMap, setShownInstancesMap] = useState<Map<string, string>>(new Map());
  const diagramDocumentationInspectorRef = useRef<DiagramDocumentationInspectorRef>(null);

  const init = useCallback(async () => {
    const serverActions = await import('../../../server/actions');
    const processInstancePromise = serverActions.getProcessInstance(props.processInstanceId);
    const flowNodeInstancesPromise = serverActions.getFlowNodeInstances(props.processInstanceId);
    const [processInstance, flowNodeInstances] = await Promise.all([processInstancePromise, flowNodeInstancesPromise]);

    const triggeredFlowNodeInstances = await serverActions.getTriggeredFlowNodeInstances(
      flowNodeInstances.map((fni) => fni.flowNodeInstanceId),
    );

    setProcessInstance(processInstance);
    setFlowNodeInstances(flowNodeInstances);
    setTriggeredFlowNodeInstances(triggeredFlowNodeInstances);

    const shownInstancesMap = new Map<string, string>();
    flowNodeInstances.sort(sortByNewest).forEach((fni) => {
      if (!shownInstancesMap.has(fni.flowNodeId)) {
        shownInstancesMap.set(fni.flowNodeId, fni.flowNodeInstanceId);
      }
    });

    setShownInstancesMap(shownInstancesMap);
  }, [props.processInstanceId]);

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

  const refresh = useCallback(async () => {
    const bpmnViewer = diagramDocumentationInspectorRef.current?.bpmnViewerRef;
    const overlays = bpmnViewer?.getOverlays();
    if (!bpmnViewer || !overlays) {
      return;
    }

    shownInstancesMap.forEach((flowNodeInstanceId) => {
      const fni = flowNodeInstances.find((fni) => fni.flowNodeInstanceId === flowNodeInstanceId);
      fni && bpmnViewer.removeMarker(fni.flowNodeId, `asdk-pii-flow-node-instance-state--${fni.state}`);
    });

    overlays.clear();
    await init();
  }, [diagramDocumentationInspectorRef.current, shownInstancesMap, flowNodeInstances, init]);

  const renderFlowNodeButtons = useCallback(
    (element: ElementLike, instances: FlowNodeInstance[]) => {
      const bpmnViewer = diagramDocumentationInspectorRef.current?.bpmnViewerRef;
      const overlays = bpmnViewer?.getOverlays();
      if (!bpmnViewer || !overlays) {
        return;
      }

      const existingButtons = overlays.get({ element: element.id, type: SDK_OVERLAY_BUTTONS_TYPE });
      if (Array.isArray(existingButtons) && existingButtons.length > 0) {
        return;
      }

      const shownInstance = instances.find((fni) => fni.flowNodeInstanceId === shownInstancesMap.get(fni.flowNodeId));
      if (!shownInstance) {
        return;
      }

      const showExecutionCount = props.showExecutionCount && instances.length > 1;
      const showPlayButton =
        props.showPlayButton &&
        PLAYABLE_TYPES.includes(element.type) &&
        shownInstance.state === FlowNodeInstanceState.suspended;

      const showRetryButton =
        props.showRetryButton && processInstance && RETRYABLE_STATES.includes(processInstance.state);

      let showGoToButton = false;
      let targetInstances: FlowNodeInstance[] = [];
      if (props.showGoToButton && RECEIVER_TYPES.includes(element.type)) {
        const triggeredByFlowNodeInstance = shownInstance.triggeredByFlowNodeInstance;
        showGoToButton = triggeredByFlowNodeInstance !== undefined;
        targetInstances = triggeredByFlowNodeInstance ? [triggeredByFlowNodeInstance] : [];
      } else if (props.showGoToButton && SENDER_TYPES.includes(element.type)) {
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
      const overlayId = overlays.add(element.id, SDK_OVERLAY_BUTTONS_TYPE, {
        position: {
          bottom: -7,
          left: isTooNarrowForTwoButtons ? -element.width / 2 : 0,
        },
        html: '<div></div>',
      } as OverlayAttrs);

      const overlay = overlays.get(overlayId) as Overlay & { htmlContainer: HTMLElement };
      const root = createRoot(overlay.htmlContainer);

      const isFirstShown = instances.indexOf(shownInstance) === 0;
      const shownInstanceIndex = instances.length - instances.indexOf(shownInstance);

      root.render(
        <BottomButtonContainer width={isTooNarrowForTwoButtons ? element.width * 2 : element.width}>
          {showExecutionCount && (
            <BottomButton
              className="app-sdk-select-none app-sdk-pointer-events-auto"
              title={`Flow Node was executed ${instances.length} times.${isFirstShown ? '' : ` You are viewing instance #${shownInstanceIndex}.`}`}
            >
              {`${isFirstShown ? '' : `${shownInstanceIndex}/`}${instances.length}`}
            </BottomButton>
          )}
          {showExecutionCount && (
            <ListButton
              onClick={() => {
                const entries = instances.map((fni) => ({
                  id: fni.flowNodeInstanceId,
                  name: `${fni.startedAt?.toLocaleString('en-GB')} - ${fni.flowNodeId}${fni.flowNodeName ? ` - ${fni.state}` : ''}${fni.flowNodeInstanceId === shownInstance.flowNodeInstanceId ? ' (selected)' : ''}`,
                  ...fni,
                }));

                const onConfirm = async (entry: FlowNodeInstance & CommandPaletteEntry): Promise<void> => {
                  bpmnViewer.removeMarker(
                    shownInstance.flowNodeId,
                    `asdk-pii-flow-node-instance-state--${shownInstance.state}`,
                  );
                  overlays.remove({
                    element: element.id,
                    type: SDK_OVERLAY_BUTTONS_TYPE,
                  });

                  setShownInstancesMap((prev) => new Map(prev).set(entry.flowNodeId, entry.flowNodeInstanceId));
                  setCommandPaletteProps(EMPTY_COMMAND_PALETTE_PROPS);
                };

                setCommandPaletteProps({
                  isOpen: true,
                  placeholder: 'Select instance to display:',
                  entries: entries,
                  onConfirm: onConfirm,
                  onClose: () => setCommandPaletteProps(EMPTY_COMMAND_PALETTE_PROPS),
                });
              }}
            />
          )}
          {showGoToButton && (
            <GoToButton
              onClick={() => {
                if (targetInstances.length > 1) {
                  const entries = targetInstances.map((fni) => ({
                    id: fni.flowNodeInstanceId,
                    name: `${fni.startedAt?.toLocaleString('en-GB')} - ${fni.flowNodeId}${fni.flowNodeName ? ` - ${fni.flowNodeName}` : ''}`,
                    ...fni,
                  }));

                  setCommandPaletteProps({
                    isOpen: true,
                    placeholder: 'Select target to go to:',
                    entries: entries,
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
            <PlayButton
              flowNodeInstanceId={shownInstance.flowNodeInstanceId}
              flowNodeType={element.type}
              // TODO use subscriptions to update data
              refresh={() => setTimeout(refresh, 500)}
            />
          )}
          {showRetryButton && (
            <RetryButton
              processInstanceId={shownInstance.processInstanceId}
              flowNodeInstanceId={shownInstance.flowNodeInstanceId}
              refresh={() => setTimeout(refresh, 500)}
            />
          )}
        </BottomButtonContainer>,
      );
    },
    [
      diagramDocumentationInspectorRef.current,
      processInstance,
      flowNodeInstances,
      triggeredFlowNodeInstances,
      shownInstancesMap,
    ],
  );

  useEffect(() => {
    init();
  }, [props.processInstanceId]);

  useEffect(() => {
    if (!processInstance?.xml) {
      return;
    }

    const bpmnViewer = diagramDocumentationInspectorRef.current?.bpmnViewerRef;
    const elementRegistry = bpmnViewer?.getElementRegistry();
    if (!bpmnViewer || !elementRegistry) {
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

        const matchingInstances = flowNodeInstances.filter((fni) => fni.flowNodeId === element.id).sort(sortByNewest);
        const shownInstance = matchingInstances.find(
          (fni) => fni.flowNodeInstanceId === shownInstancesMap.get(fni.flowNodeId),
        );

        if (!shownInstance) {
          return;
        }

        if (!bpmnViewer.hasMarker(element.id, `asdk-pii-flow-node-instance-state--${shownInstance.state}`)) {
          bpmnViewer.addMarker(element.id, `asdk-pii-flow-node-instance-state--${shownInstance.state}`);
        }

        renderFlowNodeButtons(element, matchingInstances);
      });
    });
  }, [
    diagramDocumentationInspectorRef.current,
    processInstance,
    flowNodeInstances,
    triggeredFlowNodeInstances,
    shownInstancesMap,
  ]);

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
      {(props.showRefreshButton || props.showRetryButton) && (
        <ProcessButtonsContainer>
          {props.showRetryButton && RETRYABLE_STATES.includes(processInstance.state) && (
            <RetryProcessButton processInstanceId={props.processInstanceId} refresh={() => window.location.reload()} />
          )}
          {props.showRefreshButton && <RefreshProcessButton onClick={refresh} />}
        </ProcessButtonsContainer>
      )}
      <DiagramDocumentationInspector xml={processInstance.xml} ref={diagramDocumentationInspectorRef} />
    </>
  );
}

export const ProcessInstanceInspectorNextJS = dynamic(() => Promise.resolve(ProcessInstanceInspector), {
  ssr: false,
});
