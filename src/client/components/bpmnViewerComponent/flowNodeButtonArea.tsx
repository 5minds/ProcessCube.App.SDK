import { FlowNode } from "./bpmnViewerOverlayCreator";
import ExecutionCount from "./executionCount";
import RetryButton from "./retryButton";

type FlowNodeButtonAreaProps = {
    flowNode: FlowNode;
    onRetryClick: () => void;
};

export default function FlowNodeButtonArea(props: FlowNodeButtonAreaProps) {

    const style = {
        marginTop: "7px",
    };

    const showRetryButton = !props.flowNode.IsGateway &&
        props.flowNode.ProcessInstanceState !== 'running' &&
        props.flowNode.ProcessInstanceState !== 'finished';

    return (
        <div className="flownode-overlay" style={style}>
            <div className="bpmn-element-overlay__below">
                {showRetryButton &&
                    <RetryButton onClick={props.onRetryClick} flowNode={props.flowNode}></RetryButton>
                }

                <ExecutionCount count={props.flowNode.ExecutionCount}></ExecutionCount>
            </div>
        </div>
    );
}