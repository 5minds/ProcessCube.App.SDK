import { FlowNode } from "./bpmnViewerOverlayCreator";
import ExecutionCount from "./executionCount";
import GotoButton from "./gotoButton";
import RetryButton from "./retryButton";

type FlowNodeButtonAreaProps = {
    flowNode: FlowNode;
    onRetryClick: () => void;
    onGotoClick: () => void;
};

export default function FlowNodeButtonArea(props: FlowNodeButtonAreaProps) {

    const style = {
        marginTop: "7px",
    };

    const showRetryButton = !props.flowNode.IsGateway &&
        props.flowNode.ProcessInstanceState !== 'running' &&
        props.flowNode.ProcessInstanceState !== 'finished';

    const showGotoButton = props.flowNode.IsCallActivity;

    return (
        <div className="flownode-overlay" style={style}>
            <div className="bpmn-element-overlay__below">
                {showRetryButton &&
                    <RetryButton onClick={props.onRetryClick} flowNode={props.flowNode}></RetryButton>
                }

                    <ExecutionCount count={props.flowNode.ExecutionCount}></ExecutionCount>

                {showGotoButton &&
                    <GotoButton onClick={props.onGotoClick}></GotoButton>
                }
            </div>
        </div>
    );
}