import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { Overlay, OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import dynamic from 'next/dynamic';
import { PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { FlowNodeInstance, FlowNodeInstanceState, ProcessInstance } from '@5minds/processcube_engine_sdk';

import { DiagramDocumentationInspector, DiagramDocumentationInspectorRef } from './DiagramDocumentationInspector';

type ProcessInstanceInspectorProps = {
  processInstance: ProcessInstance & { xml: string };
  flowNodeInstances: FlowNodeInstance[];
};

const byNewest = (a: FlowNodeInstance, b: FlowNodeInstance) => ((a.startedAt ?? 0) > (b.startedAt ?? 0) ? -1 : 1);

export function ProcessInstanceInspector({ processInstance, flowNodeInstances }: ProcessInstanceInspectorProps) {
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

        if (showExecutionCount || showPlayButton) {
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
            <BottomButtonContainer width={element.width}>
              {showExecutionCount && <BottomButton>{matchingInstances.length}</BottomButton>}
              {showPlayButton && <PlayButton onClick={() => console.log(matchingInstances[0])} />}
            </BottomButtonContainer>,
          );
        }
      });
    });
  }, [diagramDocumentationInspectorRef.current, flowNodeInstances]);

  return <DiagramDocumentationInspector xml={processInstance.xml} ref={diagramDocumentationInspectorRef} />;
}

function BottomButtonContainer({ width, children }: PropsWithChildren<{ width: number }>) {
  return (
    <div className={`app-sdk-flex app-sdk-gap-1 app-sdk-justify-center`} style={{ width: `${width}px` }}>
      {children}
    </div>
  );
}

function BottomButton({
  children,
  className,
  onClick,
}: PropsWithChildren<{ className?: string; onClick?: React.MouseEventHandler<HTMLDivElement> }>) {
  return (
    <div
      className={`app-sdk-flex app-sdk-w-6 app-sdk-h-4 app-sdk-text-white app-sdk-bg-slate-500 app-sdk-rounded app-sdk-text-xs app-sdk-items-center app-sdk-justify-center ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function PlayButton({ onClick }: { onClick: React.MouseEventHandler<HTMLDivElement> }) {
  return (
    <BottomButton
      className="asdk-pii-play-button app-sdk-cursor-pointer !app-sdk-pointer-events-auto !app-sdk-bg-cyan-800"
      onClick={onClick}
    >
      <svg
        className="!app-sdk-fill-none !app-sdk-stroke-white !app-sdk-stroke-[1.5px]"
        width="14px"
        height="14px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 17.3336V6.66698C5 5.78742 5 5.34715 5.18509 5.08691C5.34664 4.85977 5.59564 4.71064 5.87207 4.67499C6.18868 4.63415 6.57701 4.84126 7.35254 5.25487L17.3525 10.5882L17.3562 10.5898C18.2132 11.0469 18.642 11.2756 18.7826 11.5803C18.9053 11.8462 18.9053 12.1531 18.7826 12.4189C18.6418 12.7241 18.212 12.9537 17.3525 13.4121L7.35254 18.7454C6.57645 19.1593 6.1888 19.3657 5.87207 19.3248C5.59564 19.2891 5.34664 19.1401 5.18509 18.9129C5 18.6527 5 18.2132 5 17.3336Z" />
      </svg>
    </BottomButton>
  );
}

export const ProcessInstanceInspectorNextJS = dynamic(() => Promise.resolve(ProcessInstanceInspector), {
  ssr: false,
});
