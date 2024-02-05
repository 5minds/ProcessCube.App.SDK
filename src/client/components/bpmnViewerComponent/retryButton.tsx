import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo } from "@fortawesome/free-solid-svg-icons";
import { FlowNode } from './bpmnViewerOverlayCreator';

type RetryButtonProps = {
    flowNode: FlowNode;
    onClick: (e:any) => void;
};

export default function RetryButton(props: RetryButtonProps) {

    return (
        <div onClick={props.onClick} className="bpmn-element-overlay__below-item bpmn-element-overlay__below-item--action">
                    <div className='action-icon'>
                        <FontAwesomeIcon icon={faRedo} />
                    </div>
                    <div className='action-icon-hovered'>
                        <FontAwesomeIcon icon={faRedo}  />
                    </div>
            </div>
    );
}