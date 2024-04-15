import { FlowNode } from "./bpmnViewerOverlayCreator";
import ExecutionCount from "./executionCount";
import GotoButton from "./gotoButton";
import PlayButton from "./playButton";
import RetryButton from "./retryButton";

type FlowNodeButtonAreaProps = {
    flowNode: FlowNode;
    onRetryClick: () => void;
    onGotoClick: () => void;
    onPlayClick: () => void;
};

export default function FlowNodeButtonArea(props: FlowNodeButtonAreaProps) {

    const style = {
        marginTop: "7px",
    };

    const flowNode = props.flowNode;

    const showRetryButton = !flowNode.IsGateway &&
        flowNode.ProcessInstanceState !== 'running' &&
        flowNode.ProcessInstanceState !== 'finished';

    const showGotoButton = flowNode.IsCallActivity || ((flowNode.IsEventReceiver || flowNode.IsEventSender) && flowNode.LinkedProcessInstanceId);

    const showPlayButton = (flowNode.IsUserTask || flowNode.IsManualTask) && flowNode.State === 'suspended';

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

                {showPlayButton &&
                    <PlayButton onClick={props.onPlayClick}></PlayButton>
                }
            </div>
        </div>
    );
}