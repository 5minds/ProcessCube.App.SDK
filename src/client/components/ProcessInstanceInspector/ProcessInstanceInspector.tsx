import { Transition } from '@headlessui/react';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { Overlay, OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import { isEqual } from 'lodash';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  BpmnType,
  DataModels,
  FlowNodeInstance,
  FlowNodeInstanceState,
  ProcessInstance,
  ProcessInstanceState,
} from '@5minds/processcube_engine_sdk';

import { DiagramDocumentationInspector, DiagramDocumentationInspectorRef } from '../DiagramDocumentationInspector';
import { CommandPalette, CommandPaletteEntry, CommandPaletteProps } from './CommandPalette';
import { FlowNodeButton } from './FlowNodeButton';
import { FlowNodeButtonsContainer } from './FlowNodeButtonsContainer';
import { GoToButton } from './GoToButton';
import { ListButton } from './ListButton';
import { PlayButton } from './PlayButton';
import { ProcessButtonSeparator } from './ProcessButtonSeparator';
import { ProcessButtonsContainer } from './ProcessButtonsContainer';
import { RefreshProcessButton } from './RefreshProcessButton';
import { RetryButton } from './RetryButton';
import { RetryDialog } from './RetryDialog';
import { RetryProcessButton } from './RetryProcessButton';
import { TerminateProcessButton } from './TerminateProcessButton';
import { TokenInspector } from './TokenInspector';
import { TokenInspectorButton } from './TokenInspectorButton';

const RETRYABLE_STATES = [ProcessInstanceState.error, ProcessInstanceState.terminated];
const PLAYABLE_TYPES = [BpmnType.manualTask, BpmnType.userTask, BpmnType.untypedTask];
const SENDER_TYPES = [BpmnType.endEvent, BpmnType.intermediateThrowEvent, BpmnType.sendTask];
const RECEIVER_TYPES = [
  BpmnType.startEvent,
  BpmnType.intermediateCatchEvent,
  BpmnType.boundaryEvent,
  BpmnType.receiveTask,
];

const EMPTY_COMMAND_PALETTE_PROPS: CommandPaletteProps<FlowNodeInstance & CommandPaletteEntry> = {
  isOpen: false,
  placeholder: '',
  entries: [],
  onConfirm: () => {},
  onClose: () => {},
};

const EMPTY_RETRY_DIALOG_PROPS: {
  isOpen: boolean;
  flowNodeInstance?: FlowNodeInstance;
} = {
  isOpen: false,
};

const SDK_OVERLAY_BUTTONS_TYPE = 'asdk-buttons';

type ProcessInstanceInspectorProps = {
  processInstanceId: string;
  showFinishTaskButton?: boolean;
  showFlowNodeExecutionCount?: boolean;
  showFlowNodeInstancesListButton?: boolean;
  showGoToFlowNodeButton?: boolean;
  showRetryFlowNodeInstanceButton?: boolean;
  showProcessRefreshButton?: boolean;
  showProcessRetryButton?: boolean;
  showProcessTerminateButton?: boolean;
  showTokenInspectorButton?: boolean;
  loadingComponent?: React.ReactNode;
  onFinish?: (taskContext: {
    processInstanceId: string;
    flowNodeInstanceId: string;
    flowNodeId: string;
    taskType: BpmnType.userTask | BpmnType.manualTask | BpmnType.untypedTask;
  }) => void | Promise<void>;
};

/**
 * Displays a BPMN diagram with additional information about the process instance.
 * The diagram is interactive and allows the user to inspect the flow node instances and navigate to related flow nodes.
 */
export function ProcessInstanceInspector(props: ProcessInstanceInspectorProps) {
  const { processInstanceId } = props;
  const [commandPaletteProps, setCommandPaletteProps] = useState(EMPTY_COMMAND_PALETTE_PROPS);
  const [retryDialogProps, setRetryDialogProps] = useState(EMPTY_RETRY_DIALOG_PROPS);
  const [isTokenInspectorOpen, setIsTokenInspectorOpen] = useState(false);
  const [processInstance, setProcessInstance] = useState<ProcessInstance>();
  const [flowNodeInstances, setFlowNodeInstances] = useState<FlowNodeInstance[]>([]);
  const [triggeredFlowNodeInstances, setTriggeredFlowNodeInstances] = useState<FlowNodeInstance[]>([]);
  const [shownInstancesMap, setShownInstancesMap] = useState<Map<string, string>>(new Map());
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<FlowNodeInstance[]>([]);
  const diagramDocumentationInspectorRef = useRef<DiagramDocumentationInspectorRef>(null);

  const init = useCallback(async () => {
    const serverActions = await import('../../../server/actions');
    const processInstancePromise = serverActions.getProcessInstance(processInstanceId);
    const flowNodeInstancesPromise = serverActions.getPaginatedFlowNodeInstances(
      { processInstanceId: processInstanceId },
      {
        sortSettings: { sortBy: DataModels.FlowNodeInstances.FlowNodeInstanceSortableColumns.createdAt, sortDir: 'DESC' },
      },
    );
    const [processInstance, flowNodeInstances] = await Promise.all([processInstancePromise, flowNodeInstancesPromise]);

    const triggeredFlowNodeInstances = await serverActions.getTriggeredFlowNodeInstances(
      flowNodeInstances.map((fni) => fni.flowNodeInstanceId),
    );

    setProcessInstance(processInstance);
    setFlowNodeInstances(flowNodeInstances);
    setTriggeredFlowNodeInstances(triggeredFlowNodeInstances);

    const searchParams = new URLSearchParams(window.location.search);

    const isTokenInspectorOpen = searchParams.get('tokenInspector');
    if (isTokenInspectorOpen === 'true') {
      setIsTokenInspectorOpen(true);
    }

    const preselectedInstanceIds = searchParams.getAll('instance');
    const preselectedFlowNodeInstances = flowNodeInstances.filter((fni) =>
      preselectedInstanceIds.includes(fni.flowNodeInstanceId),
    );

    if (preselectedFlowNodeInstances.length !== preselectedInstanceIds.length) {
      searchParams.delete('instance');
      preselectedFlowNodeInstances.forEach((fni) => searchParams.append('instance', fni.flowNodeInstanceId));
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    }

    const shownInstancesMap = new Map<string, string>();
    flowNodeInstances.forEach((fni) => {
      if (!shownInstancesMap.has(fni.flowNodeId)) {
        shownInstancesMap.set(fni.flowNodeId, fni.flowNodeInstanceId);
      }
    });

    preselectedFlowNodeInstances.forEach((fni) => shownInstancesMap.set(fni.flowNodeId, fni.flowNodeInstanceId));
    setShownInstancesMap(shownInstancesMap);
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

  const refresh = useCallback(async () => {
    const bpmnViewer = diagramDocumentationInspectorRef.current?.bpmnViewerRef;
    const overlays = bpmnViewer?.getOverlays();
    if (!bpmnViewer || !overlays) {
      return;
    }

    const serverActions = await import('../../../server/actions');
    const processInstancePromise = serverActions.getProcessInstance(processInstanceId);
    const flowNodeInstancesPromise = serverActions.getFlowNodeInstances(processInstanceId);
    const [newProcessInstance, newFlowNodeInstances] = await Promise.all([
      processInstancePromise,
      flowNodeInstancesPromise,
    ]);

    const newTriggeredFlowNodeInstances = await serverActions.getTriggeredFlowNodeInstances(
      newFlowNodeInstances.map((fni) => fni.flowNodeInstanceId),
    );

    if (
      isEqual(newProcessInstance, processInstance) &&
      isEqual(newFlowNodeInstances, flowNodeInstances) &&
      isEqual(newTriggeredFlowNodeInstances, triggeredFlowNodeInstances)
    ) {
      return;
    }

    if (newProcessInstance.state !== processInstance?.state) {
      overlays.clear();
    }

    for (const [flowNodeId, flowNodeInstanceId] of shownInstancesMap.entries()) {
      const shownInstance = flowNodeInstances.find((fni) => fni.flowNodeInstanceId === flowNodeInstanceId);
      if (!shownInstance) {
        continue;
      }

      const newestInstance = newFlowNodeInstances.find((fni) => fni.flowNodeId === flowNodeId);
      const showingNewestInstance = newestInstance?.flowNodeInstanceId === flowNodeInstanceId;
      const showingSameInstance = showingNewestInstance && shownInstance.state === newestInstance.state;
      if (showingSameInstance) {
        continue;
      }

      bpmnViewer.removeMarker(flowNodeId, `asdk-pii-flow-node-instance-state--${shownInstance.state}`);
      overlays.remove({ element: flowNodeId, type: SDK_OVERLAY_BUTTONS_TYPE });
    }

    setProcessInstance(newProcessInstance);
    setFlowNodeInstances(newFlowNodeInstances);
    setTriggeredFlowNodeInstances(newTriggeredFlowNodeInstances);

    const searchParams = new URLSearchParams(window.location.search);
    const preselectedInstanceIds = searchParams.getAll('instance');

    const preselectedFlowNodeInstances = newFlowNodeInstances.filter((fni) =>
      preselectedInstanceIds.includes(fni.flowNodeInstanceId),
    );

    if (preselectedFlowNodeInstances.length !== preselectedInstanceIds.length) {
      searchParams.delete('instance');
      preselectedFlowNodeInstances.forEach((fni) => searchParams.append('instance', fni.flowNodeInstanceId));
      window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    }

    const newShownInstancesMap = new Map<string, string>();
    newFlowNodeInstances.forEach((fni) => {
      if (!newShownInstancesMap.has(fni.flowNodeId)) {
        newShownInstancesMap.set(fni.flowNodeId, fni.flowNodeInstanceId);
      }
    });

    preselectedFlowNodeInstances.forEach((fni) => newShownInstancesMap.set(fni.flowNodeId, fni.flowNodeInstanceId));
    setShownInstancesMap(newShownInstancesMap);
  }, [
    diagramDocumentationInspectorRef.current,
    processInstance,
    shownInstancesMap,
    flowNodeInstances,
    processInstanceId,
  ]);

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

      const showExecutionCount = props.showFlowNodeExecutionCount && instances.length > 1;
      const showFlowNodeInstancesListButton = props.showFlowNodeInstancesListButton && instances.length > 1;
      const showPlayButton =
        props.showFinishTaskButton &&
        PLAYABLE_TYPES.includes(element.type) &&
        shownInstance.state === FlowNodeInstanceState.suspended;

      const showRetryButton =
        props.showRetryFlowNodeInstanceButton && processInstance && RETRYABLE_STATES.includes(processInstance.state);

      let showGoToButton = false;
      let targetInstances: FlowNodeInstance[] = [];
      if (props.showGoToFlowNodeButton && RECEIVER_TYPES.includes(element.type)) {
        const triggeredByFlowNodeInstance = shownInstance.triggeredByFlowNodeInstance;
        showGoToButton = triggeredByFlowNodeInstance !== undefined;
        targetInstances = triggeredByFlowNodeInstance ? [triggeredByFlowNodeInstance] : [];
      } else if (props.showGoToFlowNodeButton && SENDER_TYPES.includes(element.type)) {
        const matchingTriggeredInstances = triggeredFlowNodeInstances.filter(
          (fni) => fni.triggeredByFlowNodeInstance?.flowNodeInstanceId === shownInstance.flowNodeInstanceId,
        );
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
        <FlowNodeButtonsContainer width={isTooNarrowForTwoButtons ? element.width * 2 : element.width}>
          {showExecutionCount && (
            <FlowNodeButton
              className="app-sdk-select-none !app-sdk-cursor-default !app-sdk-bg-slate-500"
              title={`Flow Node was executed ${instances.length} times.${isFirstShown ? '' : ` You are viewing instance #${shownInstanceIndex}.`}`}
            >
              {`${isFirstShown ? '' : `${shownInstanceIndex}/`}${instances.length}`}
            </FlowNodeButton>
          )}
          {showFlowNodeInstancesListButton && (
            <ListButton
              onClick={() => {
                const entries = instances.map((fni) => ({
                  id: fni.flowNodeInstanceId,
                  name: `${fni.startedAt?.toLocaleString('en-GB')} - ${fni.flowNodeInstanceId} - ${fni.state}${fni.flowNodeInstanceId === shownInstance.flowNodeInstanceId ? ' (selected)' : ''}`,
                  ...fni,
                }));

                const onConfirm = async (entry: FlowNodeInstance & CommandPaletteEntry): Promise<void> => {
                  const newShownInstance = instances.find((fni) => fni.flowNodeInstanceId === entry.flowNodeInstanceId);
                  if (!newShownInstance) {
                    return;
                  }

                  bpmnViewer.removeMarker(
                    shownInstance.flowNodeId,
                    `asdk-pii-flow-node-instance-state--${shownInstance.state}`,
                  );
                  overlays.remove({
                    element: element.id,
                    type: SDK_OVERLAY_BUTTONS_TYPE,
                  });

                  const searchParams = new URLSearchParams(window.location.search);
                  const selectedInstanceIds = searchParams.getAll('instance');

                  if (selectedInstanceIds.includes(shownInstance.flowNodeInstanceId)) {
                    searchParams.delete('instance', shownInstance.flowNodeInstanceId);
                  }

                  if (instances.indexOf(newShownInstance) !== 0) {
                    searchParams.append('instance', newShownInstance.flowNodeInstanceId);
                  }

                  // Not using the useRouter hook, because the component should be able to run in non-Next.js environments
                  window.history.replaceState(
                    {},
                    '',
                    `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
                  );

                  setShownInstancesMap((prev) => new Map(prev).set(element.id, entry.flowNodeInstanceId));
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
              isSender={SENDER_TYPES.includes(element.type)}
              onClick={() => {
                if (targetInstances.length === 1) {
                  const searchParams = new URLSearchParams();
                  searchParams.append('selected', targetInstances[0].flowNodeId);
                  searchParams.append('instance', targetInstances[0].flowNodeInstanceId);

                  window.location.href = `${targetInstances[0].processInstanceId}?${searchParams.toString()}`;
                  return;
                }

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
                    const searchParams = new URLSearchParams();
                    searchParams.append('selected', entry.flowNodeId);
                    searchParams.append('instance', entry.flowNodeInstanceId);

                    // Not using the useRouter hook, because the component should be able to run in non-Next.js environments
                    window.location.href = `${entry.processInstanceId}?${searchParams.toString()}`;
                  },
                  onClose: () => setCommandPaletteProps(EMPTY_COMMAND_PALETTE_PROPS),
                });
              }}
            />
          )}
          {showPlayButton && (
            <PlayButton
              flowNodeId={shownInstance.flowNodeId}
              flowNodeInstanceId={shownInstance.flowNodeInstanceId}
              flowNodeType={element.type}
              processInstanceId={shownInstance.processInstanceId}
              onPlay={props.onFinish}
            />
          )}
          {showRetryButton && (
            <RetryButton
              onClick={() => {
                setRetryDialogProps({ isOpen: true, flowNodeInstance: shownInstance });
              }}
            />
          )}
        </FlowNodeButtonsContainer>,
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
  }, [processInstanceId]);

  useEffect(() => {
    if (processInstance?.state === ProcessInstanceState.finished) {
      refresh();
      return;
    }

    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [refresh, processInstance?.state]);

  useEffect(() => {
    if (selectedElementIds.length === 0 || flowNodeInstances.length === 0) {
      setSelectedInstances([]);
      return;
    }

    const selectedInstances = flowNodeInstances.filter((fni) => {
      const isFlowNodeSelected = selectedElementIds.includes(fni.flowNodeId);
      const isInstanceShown = shownInstancesMap.get(fni.flowNodeId) === fni.flowNodeInstanceId;
      return isFlowNodeSelected && isInstanceShown;
    });

    if (selectedInstances.length === 0) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('tokenInspectorFocus');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
      );
    }

    setSelectedInstances(selectedInstances);
  }, [flowNodeInstances, selectedElementIds, shownInstancesMap]);

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
        if (element.type === 'bpmn:SequenceFlow') {
          if (sequenceFlowFinished(element)) {
            bpmnViewer.addMarker(element.id, 'asdk-pii-sequence-flow-finished');
          } else if (bpmnViewer.hasMarker(element.id, 'asdk-pii-sequence-flow-finished')) {
            bpmnViewer.removeMarker(element.id, 'asdk-pii-sequence-flow-finished');
          }
          return;
        }

        if (!flowNodeIds.has(element.id)) {
          return;
        }

        const matchingInstances = flowNodeInstances.filter((fni) => fni.flowNodeId === element.id);
        const shownInstance = matchingInstances.find(
          (fni) => fni.flowNodeInstanceId === shownInstancesMap.get(fni.flowNodeId),
        );

        if (!shownInstance) {
          return;
        }

        if (!bpmnViewer.hasMarker(element.id, 'asdk-pii-flow-node-instance-state')) {
          bpmnViewer.addMarker(element.id, 'asdk-pii-flow-node-instance-state');
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
    if (props.loadingComponent) {
      return props.loadingComponent;
    }

    return (
      <div className="app-sdk-absolute app-sdk-w-screen app-sdk-h-screen app-sdk-flex">
        <div className="app-sdk-m-auto">Fetching diagram...</div>
      </div>
    );
  }

  const showProcessButtonsContainer =
    props.showProcessRefreshButton ||
    props.showProcessRetryButton ||
    props.showProcessTerminateButton ||
    props.showTokenInspectorButton;

  const showProcessButtonSeparator =
    props.showTokenInspectorButton &&
    (props.showProcessRefreshButton || props.showProcessRetryButton || props.showProcessTerminateButton);

  return (
    <div className="app-sdk-relative app-sdk-w-full app-sdk-h-full">
      <CommandPalette {...commandPaletteProps} />
      {(props.showRetryFlowNodeInstanceButton || props.showProcessRetryButton) && (
        <RetryDialog
          {...retryDialogProps}
          processInstance={processInstance}
          onClose={() =>
            setRetryDialogProps((prev) => {
              return { ...prev, isOpen: false };
            })
          }
        />
      )}
      {showProcessButtonsContainer && (
        <ProcessButtonsContainer>
          {props.showProcessRefreshButton && <RefreshProcessButton onClick={refresh} />}
          {props.showProcessRetryButton && (
            <RetryProcessButton
              onClick={() => setRetryDialogProps({ isOpen: true })}
              disabled={!RETRYABLE_STATES.includes(processInstance.state)}
            />
          )}
          {props.showProcessTerminateButton && (
            <TerminateProcessButton
              processInstanceId={processInstanceId}
              disabled={processInstance.state !== ProcessInstanceState.running}
            />
          )}
          {showProcessButtonSeparator && <ProcessButtonSeparator />}
          {props.showTokenInspectorButton && (
            <TokenInspectorButton
              isOpen={isTokenInspectorOpen}
              open={() => {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('tokenInspector', 'true');
                window.history.replaceState(
                  {},
                  '',
                  `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
                );
                setIsTokenInspectorOpen(true);
              }}
              close={() => {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.delete('tokenInspector');
                window.history.replaceState(
                  {},
                  '',
                  `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
                );
                setIsTokenInspectorOpen(false);
              }}
            />
          )}
        </ProcessButtonsContainer>
      )}
      <Transition show={isTokenInspectorOpen}>
        <div className="app-sdk-transition app-sdk-duration-200 data-[closed]:app-sdk-opacity-0 app-sdk-w-1/4 app-sdk-min-w-64 app-sdk-absolute app-sdk-top-0 app-sdk-right-0 app-sdk-z-40 app-sdk-pt-2 app-sdk-pr-2">
          <TokenInspector
            processInstance={processInstance}
            flowNodeInstances={selectedInstances}
            close={() => {
              const searchParams = new URLSearchParams(window.location.search);
              searchParams.delete('tokenInspector');
              window.history.replaceState(
                {},
                '',
                `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`,
              );
              setIsTokenInspectorOpen(false);
            }}
          />
        </div>
      </Transition>
      <DiagramDocumentationInspector
        xml={processInstance.xml}
        ref={diagramDocumentationInspectorRef}
        setSelectedElementIds={setSelectedElementIds}
      />
    </div>
  );
}

export const ProcessInstanceInspectorNextJS = dynamic(() => Promise.resolve(ProcessInstanceInspector), {
  ssr: false,
});
