import BpmnViewer from 'bpmn-js/lib/Viewer';
import { Root, createRoot } from 'react-dom/client';
import { v4 as uuidv4 } from 'uuid';

import { DataModels } from '@5minds/processcube_engine_client';
import React from 'react';
import FlowNodeOverlay from './flowNodeOverlay';

export class FlowNode {
    private readonly id: string;
    private readonly flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstance[];
    private readonly processInstanceState: string;
    private readonly documentation: string;
    private readonly triggeredFlowNodeInstance?: DataModels.FlowNodeInstances.FlowNodeInstance;
    private type: string;

    get Id() {
        return this.id;
    }

    get Name(): string | undefined {
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        return lastFlowNodeInstance?.flowNodeName;
    }

    get CurrentFlowNodeInstanceId(): string | undefined{
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        return lastFlowNodeInstance?.flowNodeInstanceId;
    }

    get CurrentStartToken(): any {
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        return lastFlowNodeInstance?.startToken;
    }

    get CurrentEndToken(): any {
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        return lastFlowNodeInstance?.endToken;
    }

    get LinkedProcessInstanceId(): string | undefined {
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        if (this.IsCallActivity) {
            return (lastFlowNodeInstance as any).childProcessInstanceId;
        }

        if (this.IsEventReceiver) {
            return lastFlowNodeInstance?.triggeredByFlowNodeInstance?.processInstanceId;
        }

        if (this.IsEventSender && this.triggeredFlowNodeInstance) {
            return this.triggeredFlowNodeInstance.processInstanceId;
        }

        return undefined;
    }

    get State(): string {
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        return lastFlowNodeInstance?.state ?? '';
    }

    get Documentation(): string {
        return this.documentation;
    }

    get ProcessInstanceState(): string {
        return this.processInstanceState;
    }

    get IsGateway(): boolean {
        return (
            this.type === "bpmn:ComplexGateway" ||
            this.type === "bpmn:ParallelGateway" ||
            this.type === "bpmn:ExclusiveGateway" ||
            this.type === "bpmn:InclusiveGateway" ||
            this.type === "bpmn:EventBasedGateway"
        );
    }

    get IsEvent(): boolean {
        return (
            this.type === "bpmn:StartEvent" ||
            this.type === "bpmn:EndEvent" ||
            this.type === "bpmn:IntermediateCatchEvent" ||
            this.type === "bpmn:IntermediateThrowEvent" ||
            this.type === "bpmn:BoundaryEvent"
        );

    }

    get IsEventReceiver(): boolean {
        return (
            this.type === "bpmn:StartEvent" ||
            this.type === "bpmn:IntermediateCatchEvent" ||
            this.type === "bpmn:BoundaryEvent" ||
            this.type === "bpmn:ReceiveTask"
        );

    }

    get IsEventSender(): boolean {
        return (
            this.type === "bpmn:EndEvent" ||
            this.type === "bpmn:IntermediateThrowEvent" ||
            this.type === "bpmn:SendTask"
        );

    }

    get IsCallActivity(): boolean {
        return (
            this.type === "bpmn:CallActivity"
        );

    }

    get ExecutionCount(): number {
        return this.flowNodeInstances.length;
    }

    get ProcessInstanceId(): string {
        const lastFlowNodeInstance = this.flowNodeInstances.at(-1);

        return lastFlowNodeInstance?.processInstanceId ?? ''; 
    }

    constructor(id: string, processInstanceState: string, documentation: string, triggeredFlowNodeInstance?: DataModels.FlowNodeInstances.FlowNodeInstance) {
        this.id = id;
        this.flowNodeInstances = [];
        this.processInstanceState = processInstanceState;
        this.documentation = documentation;
        this.triggeredFlowNodeInstance = triggeredFlowNodeInstance;
        this.type = "";
    }

    public addFlowNodeInstance(flowNodeInstance: DataModels.FlowNodeInstances.FlowNodeInstance) {
        this.flowNodeInstances.push(flowNodeInstance);
        this.type = flowNodeInstance.flowNodeType;
    }
}

export default class BpmnViewerOverlayCreator {
    private readonly canvas: any;
    private readonly overlays: any;
    private readonly elementRegistry: any;
    private overlayIds: string[];
    private overlayRoots: { [flowNodeId: string]: Root; }

    constructor(viewer: BpmnViewer) {
        this.canvas = viewer.get('canvas');
        this.overlays = viewer.get('overlays');
        this.elementRegistry = viewer.get('elementRegistry');
        this.overlayIds = [];
        this.overlayRoots = {};
    }

    public createOverlaysFlowNodeInstances(processInstanceState: string, 
                                           flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstance[],
                                           flowNodeInstancesTriggeredByThisProcessInstance: DataModels.FlowNodeInstances.FlowNodeInstance[], 
                                           retryAction: (processInstanceId: string, flowNodeInstanceId?: string, newToken?: string) => void,
                                           gotoProcessAction: (processInstanceId: string) => void): void {
        const executedFlowNodes: FlowNode[] = this.getExecutedFlowNodes(flowNodeInstances, processInstanceState, flowNodeInstancesTriggeredByThisProcessInstance);

        this.overlayIds = [];

        for (const executedFlowNode of executedFlowNodes) {
            const flowNodeShape = this.elementRegistry.get(executedFlowNode.Id);

            const root = this.getOrCreateOverlayRoot(executedFlowNode);
            root?.render(React.createElement(FlowNodeOverlay, { flowNode: executedFlowNode, width: flowNodeShape.width, height: flowNodeShape.height, retryAction: retryAction, gotoProcessAction: gotoProcessAction }));

            this.setSequenceFlowsColor(flowNodeShape, executedFlowNodes);
        }

        const flowNodeIdsToDelete = [];

        for (const flowNodeId in this.overlayRoots) {
            const executedFlowNode = executedFlowNodes.find(f => f.Id === flowNodeId);

            if (!executedFlowNode) {
                flowNodeIdsToDelete.push(flowNodeId);
            }
        }

        flowNodeIdsToDelete.forEach(flowNodeIdToDelete => {
            const flowNodeShape = this.elementRegistry.get(flowNodeIdToDelete);
            this.removeSequenceFlowsColor(flowNodeShape);

            const root = this.overlayRoots[flowNodeIdToDelete];
            root.unmount();
            delete this.overlayRoots[flowNodeIdToDelete];
        });
    }

    private getOrCreateOverlayRoot(executedFlowNode: FlowNode): Root | undefined {

        if (executedFlowNode.Id in this.overlayRoots) {
            return this.overlayRoots[executedFlowNode.Id];
        }

        const htmlId = `bpmn-element-overlay-${uuidv4()}`;
        const containerMarkup = `<div id="${htmlId}"></div>`;

        const overlayId = this.overlays.add(executedFlowNode.Id, {
            position: {
                top: 0,
                left: 0
            },
            html: containerMarkup
        });

        this.overlayIds.push(overlayId);

        const container = document.querySelector(`#${htmlId}`);

        if (container) {
            const root = createRoot(container);
            this.overlayRoots[executedFlowNode.Id] = root;
            return root;
        }

        return undefined;
    }

    private getExecutedFlowNodes(flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstance[], processInstanceState: string, flowNodeInstancesTriggeredByThisProcessInstance: DataModels.FlowNodeInstances.FlowNodeInstance[]) {
        const executedFlowNodes: FlowNode[] = [];
        const triggeredFlowNodeInstancesByFlowNodeInstanceId: { [flowNodeInstanceId: string] : DataModels.FlowNodeInstances.FlowNodeInstance; } = {};

        for (const triggeredFlowNodeInstance of flowNodeInstancesTriggeredByThisProcessInstance) {
            if (triggeredFlowNodeInstance.triggeredByFlowNodeInstance) {
                triggeredFlowNodeInstancesByFlowNodeInstanceId[triggeredFlowNodeInstance.triggeredByFlowNodeInstance?.flowNodeInstanceId] = triggeredFlowNodeInstance;
            }
        }

        for (const flowNodeInstance of flowNodeInstances) {

            let executedFlowNode = executedFlowNodes.find(f => f.Id === flowNodeInstance.flowNodeId);

            if (!executedFlowNode) {
                const flowNodeShape = this.elementRegistry.get(flowNodeInstance.flowNodeId);
                const documentation = flowNodeShape.businessObject.documentation ? flowNodeShape.businessObject.documentation[0].text : '';

                executedFlowNode = new FlowNode(flowNodeInstance.flowNodeId, processInstanceState, documentation, triggeredFlowNodeInstancesByFlowNodeInstanceId[flowNodeInstance.flowNodeInstanceId]);
                executedFlowNodes.push(executedFlowNode);
            }

            executedFlowNode.addFlowNodeInstance(flowNodeInstance);
        }
        return executedFlowNodes;
    }

    private setSequenceFlowsColor(flowNodeShape: any, executedFlowNodes: FlowNode[]) {
        if (flowNodeShape && flowNodeShape.businessObject.incoming) {
            for (const sequenceFlow of flowNodeShape.businessObject.incoming) {
                const previousExecutedFlowNode = executedFlowNodes.find((fn) => fn.Id === sequenceFlow.sourceRef?.id);

                if (previousExecutedFlowNode) {
                    this.canvas.addMarker(sequenceFlow.id, 'connection-done');
                }
            }
        }
    }

    private removeSequenceFlowsColor(flowNodeShape: any) {
        if (flowNodeShape && flowNodeShape.businessObject.incoming) {
            for (const sequenceFlow of flowNodeShape.businessObject.incoming) {
                    this.canvas.removeMarker(sequenceFlow.id, 'connection-done');
            }

            if (flowNodeShape.businessObject.outgoing) {
                for (const sequenceFlow of flowNodeShape.businessObject.outgoing) {
                    this.canvas.removeMarker(sequenceFlow.id, 'connection-done');
                }
            }
        }
    }
}