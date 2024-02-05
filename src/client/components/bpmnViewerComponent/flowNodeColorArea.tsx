import { FlowNode } from "./bpmnViewerOverlayCreator";

type FlowNodeColorAreaProps = {
    flowNode: FlowNode;
    width: number;
    height: number;
    onClick?: () => void;
};

export default function FlowNodeColorArea(props: FlowNodeColorAreaProps) {
    const style = {
        width: props.width,
        height: props.height
    };

    let specialClass = "";
    const colorStyle = {
        width: props.width,
        height: props.height
    };

    if (props.flowNode.IsGateway) {
        colorStyle.height *= 0.7;
        colorStyle.width *= 0.7;
        specialClass = "bpmn-element-overlay-backdrop--gateway"
    } else if (props.flowNode.IsEvent) {
        specialClass = "bpmn-element-overlay-backdrop--rounded";
    }

    return (
        <div onClick={props.onClick} className="bpmn-element-overlay-backdrop cursor-pointer" style={style}>
            <div className={`flow-node-${props.flowNode.State}-state-overlay ${specialClass}`} style={colorStyle}></div>
        </div>
    );
}