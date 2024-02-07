import React from 'react';

import { DataModels } from '@5minds/processcube_engine_client';
import BpmnViewer from 'bpmn-js/lib/Viewer';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import BpmnViewerOverlayCreator from './bpmnViewerOverlayCreator';

import './bpmnViewer.css';

type BpmnViewerComponentProps = {
    diagramXML: string;
    className: string;
    processInstanceState: string;
    flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstance[];
    retryAction: (processInstanceId: string, flowNodeInstanceId?: string, newToken?: any) => void;
    gotoProcessAction: (processInstanceId: string) => void;
};

type BpmnViewerComponentState = {
    diagramXML: string;
};

export class BpmnViewerComponent extends React.Component<BpmnViewerComponentProps, BpmnViewerComponentState> {
    private readonly containerRef;
    private bpmnViewer: any;
    private bpmnViewerOverlayCreator!: BpmnViewerOverlayCreator;

    constructor(props: BpmnViewerComponentProps) {
        super(props);

        this.state = { diagramXML: '' };
        this.containerRef = React.createRef<HTMLDivElement>();
    }

    public componentDidMount() {

        const {
            diagramXML
        } = this.props;

        const container = this.containerRef.current as HTMLElement;

        this.bpmnViewer = new BpmnViewer({ container, height: 600, additionalModules: [ZoomScrollModule, MoveCanvasModule] });
        this.bpmnViewerOverlayCreator = new BpmnViewerOverlayCreator(this.bpmnViewer);

        if (diagramXML) {
            return this.displayDiagram(diagramXML);
        }
    }

    public componentWillUnmount() {
        this.bpmnViewer.destroy();
    }

    public componentDidUpdate(prevProps: BpmnViewerComponentProps, prevState: BpmnViewerComponentState) {
        const {
            props,
            state
        } = this;

        const currentXML = props.diagramXML || state.diagramXML;

        const previousXML = prevProps.diagramXML || prevState.diagramXML;

        if (currentXML && currentXML !== previousXML) {
            return this.displayDiagram(currentXML);
        }


        this.bpmnViewerOverlayCreator.createOverlaysFlowNodeInstances(this.props.processInstanceState, this.props.flowNodeInstances, props.retryAction, props.gotoProcessAction);
    }

    private displayDiagram(diagramXML: string) {
        console.log("displayDiagram");
        this.bpmnViewer.importXML(diagramXML).then(() => {

            this.bpmnViewer.get('canvas').zoom('fit-viewport');
            this.bpmnViewerOverlayCreator.createOverlaysFlowNodeInstances(this.props.processInstanceState, this.props.flowNodeInstances, this.props.retryAction, this.props.gotoProcessAction);
        });
    }

    public render() {
        return (
            <div className={this.props.className} ref={this.containerRef}></div>
        );
    }
}