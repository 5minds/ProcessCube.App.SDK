import BpmnViewer from 'bpmn-js/lib/Viewer';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import React from 'react';

import { DataModels } from '@5minds/processcube_engine_client';

import './bpmnViewer.css';
import BpmnViewerOverlayCreator from './bpmnViewerOverlayCreator';

type BpmnViewerComponentOptions = {
  height?: number;
  fillColor?: string;
  strokeColor?: string;
};

type BpmnViewerComponentProps = {
  diagramXML: string;
  className: string;
  processInstanceState: string;
  flowNodeInstances: DataModels.FlowNodeInstances.FlowNodeInstance[];
  flowNodeInstancesTriggeredByThisProcessInstance: DataModels.FlowNodeInstances.FlowNodeInstance[];
  retryAction: (processInstanceId: string, flowNodeInstanceId?: string, newToken?: any) => void;
  gotoProcessAction: (processInstanceId: string) => void;
  gotoManualOrUserTaskAction: (processInstanceId: string, flowNodeId: string) => void;
  options?: BpmnViewerComponentOptions;
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
    const { diagramXML, options } = this.props;

    const container = this.containerRef.current as HTMLElement;

    this.bpmnViewer = new BpmnViewer({
      container,
      height: options?.height ?? 600,
      bpmnRenderer: {
        defaultFillColor: options?.fillColor,
        defaultStrokeColor: options?.strokeColor,
      },
      additionalModules: [ZoomScrollModule, MoveCanvasModule],
    });
    this.bpmnViewerOverlayCreator = new BpmnViewerOverlayCreator(this.bpmnViewer);

    if (diagramXML) {
      return this.displayDiagram(diagramXML);
    }
  }

  public componentWillUnmount() {
    this.bpmnViewer.destroy();
  }

  public componentDidUpdate(prevProps: BpmnViewerComponentProps, prevState: BpmnViewerComponentState) {
    const { props, state } = this;

    const currentXML = props.diagramXML || state.diagramXML;

    const previousXML = prevProps.diagramXML || prevState.diagramXML;

    if (currentXML && currentXML !== previousXML) {
      return this.displayDiagram(currentXML);
    }

    this.bpmnViewerOverlayCreator.createOverlaysFlowNodeInstances(
      this.props.processInstanceState,
      this.props.flowNodeInstances,
      props.flowNodeInstancesTriggeredByThisProcessInstance,
      props.retryAction,
      props.gotoProcessAction,
      props.gotoManualOrUserTaskAction,
    );
  }

  private displayDiagram(diagramXML: string) {
    this.bpmnViewer.importXML(diagramXML).then(() => {
      const canvas = this.bpmnViewer.get('canvas');
      const viewbox = canvas.viewbox();
      const center = {
        x: viewbox.outer.width / 2,
        y: viewbox.outer.height / 2,
      };
      canvas.zoom('fit-viewport', center);
      this.bpmnViewerOverlayCreator.createOverlaysFlowNodeInstances(
        this.props.processInstanceState,
        this.props.flowNodeInstances,
        this.props.flowNodeInstancesTriggeredByThisProcessInstance,
        this.props.retryAction,
        this.props.gotoProcessAction,
        this.props.gotoManualOrUserTaskAction,
      );
    });
  }

  public render() {
    return <div className={this.props.className} ref={this.containerRef}></div>;
  }
}
